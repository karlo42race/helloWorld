import { check, Match } from 'meteor/check';
import { AllResults, VirtualRaces, Orders } from '/imports/api/collections.js';

const getOneData = (c) => {
	let { race, user_name, user_email, timing, distance, position, category, bib_number, timing_per_km, team, gender, userID } = c;

	let profilePic = [];

	// for multiple partner races
	if(Array.isArray(userID)) {
		_.each(userID, (u) => {
			let oneUser = Meteor.users.findOne({_id: u});	
			profilePic.push(oneUser.profilePic);
		})
	} else {
		let oneUser = Meteor.users.findOne({_id: userID});
		profilePic = oneUser.profilePic;
	}
	
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
		profilePic
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
	'results.getRanking'(race, limit, skipCount, category, elite) {
		let data = [];
		
		let options = {
			limit: limit,
			skip: skipCount,
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

	// get list of user results
	'results.getUserResults'(skipCount) {
		check(skipCount, Number);
		let options = {
			limit: 50,
			skip: skipCount,
			sort: { createdAt: -1 }
		};
		let data = [];

		let virtualRaceFields = {					
			'race_type': 1,
			'start_date': 1,
			'end_date': 1,
			'bib_design': 1,
			'cert_finish': 1,
			'badge_grey': 1,
			'badge_color': 1,
			'banner_card': 1,
			'slug': 1,
			'hide_banner_on_dashboard': 1,			
		};

		let results = AllResults.find({ userID: this.userId }, options).fetch();
		_.each(results, (c) => {
			let oneVirtualRace = VirtualRaces.findOne({_id: c.raceID}, { fields: virtualRaceFields });
			let oneData = c;
			Object.assign(c, oneVirtualRace);
			data.push(c);

		});

		return data;

	},

	// current, 0, 10
	'dashboardResults'(type, skipCount, dataLimit) {
		let racesArr = [],
			  fields = {
					'race_name': 1, 
					'race_type': 1,
					'start_date': 1,
					'end_date': 1,
					'bib_design': 1,
					'cert_finish': 1,
					'badge_grey': 1,
					'badge_color': 1,
					'banner_card': 1,
					'slug': 1,
					'hide_banner_on_dashboard': 1,
				};

		if (type == "current") {
			let today = new Date();
			let currentRaces = VirtualRaces.find({end_date: { $gte: today }});

			let currentRacesFetched = currentRaces.fetch();
			
			_.each(currentRacesFetched, (race) => {
				racesArr.push(race.race_name);
			})
			
			return [
				AllResults.find({ $and: [{ race: {$in: racesArr}, userID: this.userId }] }).fetch(),
				// Orders.find({ $and: [{ race: {$in: racesArr}, userID: this.userId }] }, { fields: {'orderNum': 1, 'status': 1, 'race': 1 } }).fetch(),
				VirtualRaces.find({end_date: { $gte: today }}, {fields: fields}).fetch()
			]
		};

		if (type == "past") {
			let options = {
				limit: dataLimit,
				skip: skipCount,
				sort: {createdAt: -1},
			};
			
			let userResults = AllResults.find({ userID: this.userId }).fetch();
			_.each(userResults, (c) => {
				let raceName = c.race;		
				let oneRace = VirtualRaces.findOne({race_name: raceName});
				if(oneRace) {
					let { start_date, end_date } = oneRace;
					let startDate = new Date(start_date);
					let endDate = new Date(end_date);
					let today = new Date();				
				
					if ((today.getTime() > endDate.getTime() && today.getTime() > startDate.getTime())) {
						racesArr.push(raceName)					
					}	
				}			
			})

			// Counts.publish(this, 'dataCount', AllResults.find({ $and: [{ race: {$in: racesArr}, userID: this.userId }] }, options), {nonReactive: true});
			// Counts.publish(this, 'totalPastResultsCount', AllResults.find({ $and: [{ race: {$in: racesArr}, userID: this.userId }] }), {nonReactive: true});
			
			return [		
				AllResults.find({ $and: [{ race: {$in: racesArr}, userID: this.userId }] }, options).fetch(),
				VirtualRaces.find({ race_name: {$in: racesArr}}, {fields: fields}).fetch()	
			];
		};
	},

});
