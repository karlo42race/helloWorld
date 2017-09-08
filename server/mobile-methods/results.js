import { check, Match } from 'meteor/check';
import { AllResults } from '/imports/api/collections.js';

const getOneData = (c) => {
	let { race, user_name, user_email, timing, distance, position, category, bib_number, timing_per_km, team, gender, userID } = c;
	let oneUser = Meteor.users.findOne({_id: userID});
	let oneData = {
		race, 
		user_name, 
		user_email, 
		timing, 
		distance, 
		position, 
		category, 
		bib_number, 
		timing_per_km, 
		team, 
		gender, 
		userID, 
		profilePic: oneUser.profilePic
	};

	return oneData;
};

Meteor.methods({
	// get ranking for a race for user only
	'results.getUserRanking'(race) {
		let userResult = AllResults.findOne({ race: race, userID: this.userId });
		let userData = getOneData(userResult);
		return userData;
	},

	// get ranking table for a race 
	'results.getRanking'(race, limit, category, elite) {
		let data = [];
		
		let options = {
			limit: limit,
			sort: { position: 1 }
		};

		let findFilter = { 
			race: race,	
			category: category
		};

		if(elite) {
			eliteValue = { $gt: 0 };
			findFilter = { 
				race: race,							 		 
		 		category: category,
	 		 	elite_position: { $gt: 0 },
	 		}
		}; 

		let results = AllResults.find({ $and : [findFilter] }, options).fetch();
		
		_.each(results, (c) => {
			let oneData = getOneData(c);
			data.push(oneData);
		});

		return data;

	},

});
