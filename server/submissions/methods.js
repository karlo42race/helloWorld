import { check, Match } from 'meteor/check';
import { Submissions, AllResults, UserMeta } from '/imports/api/collections.js';
import { 
	addToUserMeta,
	updateOneResult,
	updateOneUserMeta,
	updateRaceResult,
	sendAdminFraudAlert
} from './modules/submission-helpers';

Meteor.methods({
	// submit run
	'submissions.insert'(values) {
		console.log(`Logging: submissions.insert, values: ${values}`);

		let { distance, hour, min, sec, url, journal, photo_url, timingInSec, timing_per_km, selectedResultIds, raceID, stravaData } = values;
		let summary_polyline = null, map_id = null;
		// check if strava run has aleady been submitted before
		if(stravaData) {
			let strava_map = stravaData.map;
			if(strava_map) {
				map_id = 	strava_map.id;
				summary_polyline = strava_map.summary_polyline;
				let exists = Submissions.findOne({map_id: map_id, userID: this.userId});
				if(exists)
					throw new Meteor.Error('submission_exists', 'Your latest Strava activity has already been recorded');
			}			
		}

		let gender = '',
		 		user_name = '',
		 		user_publicID = '';

		let user = Meteor.users.findOne({_id: this.userId});
		if (user) {
			let { profile, publicID } = user;
			gender = profile.gender;	
			user_name = profile.name;
			user_publicID = publicID;
		} else {
			throw new Meteor.Error('no-user', 'No such user');
		}

		// ensure new distance only 2 decimal
		distance = Math.round(distance * 100) / 100;

		// check timing 
		if (timing_per_km < 100) 
			throw new Meteor.Error('wrong-timing', 'Error: Please check your timing');

		Submissions.insert({
			user_name,
			userID: this.userId, 
			user_publicID,
			raceID,
			distance, 
			hour: parseInt(hour), 
			min: parseInt(min), 
			sec: parseInt(sec), 
			timingInSec: parseInt(timingInSec), 
			journal, 
			photo_url,
			url, 
			privacy_level: 'public',
			timing_per_km: parseInt(timing_per_km),
			gender,
			likes: 0,
			cheers: [],
			map_id,
			summary_polyline,
			import_data: stravaData,
			createdAt: new Date()
		}, (err, res) => {
			if (err) {
				console.log('Submissions: err encountered: ', err);
				throw new Meteor.Error('err-submission', 'There was an error in submitting');
			} else {				
				// update userMeta
				addToUserMeta(values, this.userId);				
				
				console.log('updating: ', selectedResultIds);
				if(selectedResultIds.length > 0) {
					_.each(selectedResultIds, (r) => {
						// updateRaceResult(resultId, submission, submissionId, userId);
						updateRaceResult(r, values, res, this.userId);
					})
				};
				
				// fraud alert
				Meteor.defer(() => {	
					if(parseInt(timing_per_km) < 240) {
						// send email alert to admin for pace < 4:00
						let subject = "Potential fraud with pace < 4'00"
						sendAdminFraudAlert(values, user_name, user_publicID, subject, res);
					}

					if(parseInt(timing_per_km) > 1199) {
						// send email alert to admin for pace > 20:00 pedometer alert
						let subject = "Potential fraud with pace > 20'00"
						sendAdminFraudAlert(values, user_name, user_publicID, subject, res);
					}
				});

			}
		});
		console.log('Submissions: adding submisison by ', this.userId, 'complete');		

	},	

	// edit submission	
	'submissions.edit'(data) {
		console.log(`Logging: submissions.edit, values: ${values}`);

		let { id, distance, hour, min, sec, timingInSec, timing_per_km, url, photo_url, journal } = data;	
		let oldSubmission = Submissions.findOne({_id: id}),
				oldDistance = oldSubmission.distance,
				oldTimingInSec = oldSubmission.timingInSec;		
		
		// check submission exists
		if(!oldSubmission)
			throw new Meteor.Error('no-submission', 'Error: No such submission');
		// check if user is owner		
		if (oldSubmission.userID !== this.userId)
			throw new Meteor.Error('not-owner', 'Error: You do not have permission');

		// ensure new distance only 2 decimal
		newDistanceFix = Math.round(parseFloat(distance) * 100) / 100;
				
		Submissions.update({
			_id: id
		}, {
			$set: {
				distance: newDistanceFix,
				hour,
				min,
				sec,
				timingInSec,
				url,
				journal,
				photo_url,
				updatedOn: new Date()
			}
		})

		let results = AllResults.find({submissions: id }).fetch();		
		if (results.length > 0) {			
			console.log('AllResults: updating results affected by submission: ', id, '..');
			_.each(results, (c) => {
				var resultId = c._id;				
				let oldResultDistance = c.distance;
				let oldResultTiming = c.timing;
				let newResultDistance = oldResultDistance - oldDistance + distance;
						newResultTiming = oldResultTiming - oldTimingInSec + timingInSec;
						new_timing_per_km = Math.round(parseInt(newResultTiming) / newResultDistance);
				
				// ensure new distance only 2 decimal
				newResultDistanceFix = Math.round(newResultDistance * 100) / 100;

				if(c.race_type == 'virtual_race') { // check if result affected is virtual race
					if (newResultDistance < parseInt(c.category)) { // if edited is less than category 
						newResultDistanceFix = newResultTiming = new_timing_per_km = 0; // reset result
						console.log('AllResults reset, virtual race not completed', c.race);
					} 
					if(c.distance == 0) { 
					// if edit from a resetted submission, take distance & timing straight from submission 
						newResultDistanceFix = newDistance;
						newResultTiming = newTimingInSec;
						new_timing_per_km = Math.round(parseInt(newResultTiming) / newResultDistance);
					}
				}
				
				// update results
				updateOneResult(resultId, newResultTiming, newResultDistanceFix, new_timing_per_km);				
			});
		} else {
			console.log('AllResults: no results affected by submission: ', id);
		}

		// update userMeta
		let userMeta = UserMeta.findOne({userID: this.userId});		
		// sanity check for userMeta;					
		if (!userMeta) 				
			return console.log('Error: no userMeta', this.userId);			

		let	metaDistance = userMeta.total_distance + newDistanceFix - oldDistance;
				metaTiming = parseInt(userMeta.total_timing) + parseInt(timingInSec) - parseInt(oldTimingInSec);
				metaSubmssionsCount = userMeta.submissions_count;

		// ensure new distance only 2 decimal
		metaDistanceFix = Math.round(parseFloat(metaDistance) * 100) / 100;
		
		updateOneUserMeta(this.userId, metaDistanceFix, metaTiming, metaSubmssionsCount);		
	}, 

	// Remove Submission
	'submissions.delete'(submissionID) {
		console.log('Submissions: deleting ', submissionID, '..');
				
		let submission = Submissions.findOne({_id: submissionID});		
				submissionDistance = submission.distance;
				submissionTiming = submission.timingInSec;
		
		// check submission exists
		if(!submission)
			throw new Meteor.Error('no-submission', 'Error: No such submission');		
		// check if user is owner		
		if (submission.userID !== this.userId)
			throw new Meteor.Error('not-owner', 'You do not have permission to delete');

		// update AllResults
		let results = AllResults.find({submissions: submissionID }).fetch();		
		if (results) {
			console.log('AllResults: updating results affected by submission: ', submissionID, '..');			
			_.each(results, (c) => {			
				var resultID = c._id;
				let oldResultDistance = c.distance;
				let oldResultTiming = c.timing;
				let newResultDistance = oldResultDistance - submissionDistance;
						newResultTiming = oldResultTiming - submissionTiming;
						new_timing_per_km = 0;

				// catch for 0 timing left
				if (isNaN(newResultTiming) || (newResultTiming <= 0)) {
					console.log('timing has error ', newResultTiming, '| timing set to 0')			
					newResultTiming = 0;							
				} else {
					new_timing_per_km = Math.round(parseInt(newResultTiming) / newResultDistance);
				}

				// ensure new distance only 2 decimal
				newResultDistanceFix = Math.round(newResultDistance * 100) / 100;				

				// update results
				updateOneResult(resultID, newResultTiming, newResultDistanceFix, new_timing_per_km);				
				
				AllResults.update(
					{_id: resultID},
					{ $pull: {
		        	submissions: submissionID
		      	} 
		      },
				)
				if (c.submitBy) { //submitBy exists
					AllResults.update(
					{_id: resultID},
						{ $pull: {
			        	submitBy: submission.userID
			      	} 
			      },
					)	
				}
				console.log('AllResults updated for ', c._id, 'by user: ', c.user_name);
			});	
		}			

		Submissions.remove(submissionID);
		console.log('Submissions: deleting ', submissionID, 'complete');
		let userID = submission.userID;
		// update userMeta
		let userMeta = UserMeta.findOne({userID: userID});
		// sanity check for userMeta;					
		if (!userMeta) 				
			return console.log('Error: no userMeta2', userID);			

		let	metaDistance = userMeta.total_distance - submissionDistance;
				metaTiming = parseInt(userMeta.total_timing) - parseInt(submissionTiming);
				newSubmissionCount = parseInt(userMeta.submissions_count - 1);

		// ensure new distance only 2 decimal
		metaDistanceFix = Math.round(parseFloat(metaDistance) * 100) / 100;
		
		updateOneUserMeta(userID, metaDistanceFix, metaTiming, newSubmissionCount);		
	},	

	// Add like to submission
	'submissions.addLike'(value) {
		let submissionID = value.trim();
		check(submissionID, String);
		console.log(`Submissions: adding like for "${submissionID}" by ${this.userId}`);
		let submission = Submissions.findOne({_id: submissionID});
		if(!submission) {
			console.warn(`Submissions.add:Like: No such submission, id: "${submissionID}"`);
			throw new Meteor.Error('no-submission', 'No such submission');			
		};

		let cheers = submission.cheers ? submission.cheers : [];
		let cheeredIndex = cheers.indexOf(this.userId);

		if(cheeredIndex > -1) {
			throw new Meteor.Error('user-cheered', 'Error');
		} else {
			Submissions.update(
				{_id: submissionID},
				{ $push: {
	        	cheers: this.userId
	      	} 
	      },
			)
			let likesArray = submission.cheers,
					likesCount = parseInt(likesArray.length) + 1;				

			Submissions.update(
				{_id: submissionID},
				{ $set: {
	        	likes: likesCount
	      	} 
	      },
			)		
		}
	},

	// Un like to submission
	'submissions.unLike'(submissionID) {
		console.log('Submissions: stopping like for ', submissionID, 'by', this.userId);
		let submission = Submissions.findOne({_id: submissionID});
		let { cheers } = submission;
		let cheeredIndex = cheers.indexOf(this.userId);
		
		if(cheeredIndex > -1) {
			Submissions.update(
				{_id: submissionID},
				{ $pull: {
	        	cheers: this.userId
	      	} 
	      },
			)
			let likesArray = submission.cheers;
					likesCount = parseInt(likesArray.length) - 1;				

			Submissions.update(
				{_id: submissionID},
				{ $set: {
	        	likes: likesCount
	      	} 
	      },
			)	
		}	else {
			throw new Meteor.Error('user-no-cheer', 'Error');
		}	
			
	},

})
