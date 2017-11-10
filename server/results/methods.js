import { check, Match } from 'meteor/check';
import { AllResults, VirtualRaces } from '/imports/api/collections.js';

Meteor.methods({
	'results.getCurrentResult'() {
		let racesArr = [];			
				
		let userResults = AllResults.find({ userID: this.userId }).fetch();
		_.each(userResults, (c) => {
			let raceName = c.race;		
			let { bib_number, raceID, race, race_type, timing, timing_per_km, team, userID, user_name, distance, category } = c;
			let oneRace = VirtualRaces.findOne({_id: raceID});
			if(oneRace) {
				let { start_date, end_date, race_name_lang } = oneRace;
				let startDate = new Date(start_date);
				let endDate = new Date(end_date);
				let today = new Date();
			
				if ((today.getTime() <= endDate.getTime() && today.getTime() >= startDate.getTime())) {
					let raceObj = {
						bib_number, 
						category,
						distance,
						raceID, 
						race,
						race_name_lang,
						race_type, 
						timing, 
						timing_per_km, 
						team, 			
						userID,
						user_name,			
					}
					racesArr.push(raceObj)
				}
			}			
		});
		
		return racesArr;	
	},

	'results.getCountedResults'(raceIdArray) {
		let racesArr = [];			

		let userResults = AllResults.find({ userID: this.userId, raceID: {$in: raceIdArray} }).fetch();
		_.each(userResults, (c) => {
			let raceName = c.race;		
			let { bib_number, raceID, race, race_type, timing, timing_per_km, team, userID, user_name, distance, category } = c;
			let oneRace = VirtualRaces.findOne({_id: raceID});
			if(oneRace) {
				let { race_name_lang } = oneRace;				
				let raceObj = {
					bib_number, 
					category,
					distance,
					raceID, 
					race,
					race_name_lang,
					race_type, 
					timing, 
					timing_per_km, 
					team, 			
					userID,
					user_name,			
				}
				racesArr.push(raceObj)
				
			}			
		});
		
		return racesArr;	
	},

});
