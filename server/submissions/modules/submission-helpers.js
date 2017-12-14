import { check } from 'meteor/check';
import { AllResults, VirtualRaces, UserMeta, Submissions } from '/imports/api/collections.js';
import { AlertFraudToAdmin } from '/server/emails/fraud-alert-emails';

const updateOneResult = (resultId, timing, distance, timing_per_km) => {
	// update results
	AllResults.update(
	{_id: resultId}, {
		$set: { timing, distance, timing_per_km }
	});	
}

const updateOneUserMeta = (userId, total_distance, total_timing, submissions_count) => {
	console.log('UserMeta: updated for', userId);	
	// update results
	UserMeta.update(
	{userID: userId}, {
		$set: { total_distance, total_timing, submissions_count }
	});	
}

const addToUserMeta = (values, userId) => {	
	let userMeta = UserMeta.findOne({ userID: userId });
	// sanity check for userMeta;					
	if (!userMeta)
		return console.log('Error: no userMeta2', userId);
	
	let { total_distance, total_timing, submissions_count } = userMeta;
	let { distance, timingInSec } = values;

	let	metaDistance = parseFloat(total_distance) + distance;
			metaTiming = parseInt(total_timing) + timingInSec;
			metaSubmssionsCount = parseInt(submissions_count) + 1;
	
	// ensure new distance only 2 decimal
	metaDistanceFix = Math.round(parseFloat(metaDistance) * 100) / 100;
	
	updateOneUserMeta(userId, metaDistanceFix, metaTiming, metaSubmssionsCount);	
}

const addSubmitBy = (resultID, userID) => {
	AllResults.update(
	{_id: resultID}, {
		$push: {
			submitBy: userID
		}
	});
}

const getRulesByCategory = (categoryId, rules) => {
    let result_rules = rules.find((rule) => { return rule.category === categoryId});
    return result_rules;

};
const updateRaceResult = (resultId, values, submissionId, userID) => {
	// update result
	let result = AllResults.findOne({_id: resultId}),			
		  resultUserID = result.userID,
		  race = result.race,
		  { distance, timingInSec } = values;
	
	let oneRace = VirtualRaces.findOne({race_name: race});
	const { bib_number } = result;
	const { start_date, end_date } = oneRace;

	let startDate = moment(start_date).toDate(),
	 		endDate = moment(end_date).toDate(),
	 		today = new Date;
	
	// Checks to ensure submission counted only during race period
	// if today is after race ends or before race starts
	if ((today.getTime() > endDate.getTime() || today.getTime() < startDate.getTime())) 		
		return console.log(`Error submission: userId - ${resultUserID}, ${bib_number} is entering result for ${race}: ${distance} beyond the race period`);	

	// Checks to ensure result belongs to user;
	if (Array.isArray(resultUserID)) { // result userid is array e.g. for vday
		if (resultUserID.indexOf(userID) < 0) { // userid is not in array, submission not by user
			throw new Meteor.Error('not-same-user', 'Error: User is different');
			console.log('Error: Submission and result belongs to different user.', bib_number);
		}
	} else { // result userid not in array, e.g. normal races
		if (resultUserID !== userID) { // if userid is not result user id, submission not by user
			throw new Meteor.Error('not-same-user', 'Error: User is different');
			console.log('Error: Submission and result belongs to different user.', bib_number);
		}
	}
	
	if (result.race_type == 'virtual_race') { // only check that user has submitted if it's a virtual race
		// if result is for buddy race
		if (Array.isArray(resultUserID) ) {
			// check if user has submitted 
			let submitUserArray = result.submitBy;
			if (submitUserArray) { // partner/ user has submitted before								
				if (submitUserArray.indexOf(userID) > -1) { // user has submitted
					// do not add 
					throw new Meteor.Error('combined-race-submitted', 'You have already submitted for combined race');							
				} else { // user has not submitted
					// check that partner has submitted
					if (submitUserArray.length > 0) { // partner has submitted
						// distance not enough to cover distance remaining
						if (distance < (result.category - result.distance) ) {
							throw new Meteor.Error('combined-distance-not-enough', 'Not enough distance to complete the race');
						} else { // distance enough to cover remaining
							// add submitUserArray 															
							addSubmitBy(resultId, userID);
						}
																							
					} else { // submitUserArray is empty, no one submitted
						// add submitUserArray 															
						addSubmitBy(resultId, userID);
					} 
				}
			} else { // no submitUserArray
				// add submitUserArray 															
				addSubmitBy(resultId, userID);
			}							
		} else {
			// check if user completed vr already
			if(result.race_type == "virtual_race") {
				if(result.distance >= result.category)
					return 
			}
		}
	}
    if (result.race_type==='hell_week'){
        let all_submissions = Submissions.findOne({ _id: submissionId });
        let rule = getRulesByCategory(result.category, oneRace.rules);
        // If user already made all the submission
        let user_pace =   Math.round(parseInt(timingInSec) / distance);
        if (result.submissions.length >= rule.submissions || user_pace < rule.pace || distance<rule.distance){
            throw new Meteor.Error('race-submitted-hell-week-eligible', 'Not eligible for hell week. Will be added in personal record.');
            return
        }
        AllResults.update(
            {_id: resultId}, {
                $push: {
                    submissions: submissionId,
                    all_submission_distance: all_submissions.distance
                }
            });
    }
	
    let { category, race_type, race_name } = result;

	let initialDistance = result.distance;
			initialTimingInSec = result.timing;
	let newResultDistance = initialDistance + distance;
			newResultTiming = initialTimingInSec + timingInSec;
			new_timing_per_km = Math.round(parseInt(newResultTiming) / newResultDistance);

	// ensure new distance only 2 decimal
	newResultDistanceFix = Math.round(newResultDistance * 100) / 100;

	console.log('Submissions: updating result for resultId', resultId);
	
	// update results
	updateOneResult(resultId, newResultTiming, newResultDistanceFix, new_timing_per_km);	
}

const sendAdminFraudAlert = (values, user_name, user_publicID, subject, submissionID) => {
	// to admin - ZM for fraud handling
	Email.send({
	  to: "fraud@42race.com",
	  // to: 'heyaugust@gmail.com',
	  from: "42Race <contact@42race.com>",
	  subject: subject,
	  html: AlertFraudToAdmin(values, user_name, user_publicID, submissionID),
	});
	console.log('Submission: Fraud alert email sent to admin');
}

export { 
	addToUserMeta,
	updateOneResult,
	updateOneUserMeta,
	updateRaceResult,
	sendAdminFraudAlert
};
