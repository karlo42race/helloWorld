import { check, Match } from 'meteor/check';
import { VirtualRaces, AllResults, Orders } from '/imports/api/collections.js';

// dashboard results 
Meteor.publish('dashboardResults', function(type, skipCount, dataLimit) {
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
			AllResults.find({ $and: [{ race: {$in: racesArr}, userID: this.userId }] }),
			Orders.find({ $and: [{ race: {$in: racesArr}, userID: this.userId }] }, { fields: {'orderNum': 1, 'status': 1, 'race': 1 } }),
			VirtualRaces.find({end_date: { $gte: today }}, {fields: fields})
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

		Counts.publish(this, 'dataCount', AllResults.find({ $and: [{ race: {$in: racesArr}, userID: this.userId }] }, options), {nonReactive: true});
		Counts.publish(this, 'totalPastResultsCount', AllResults.find({ $and: [{ race: {$in: racesArr}, userID: this.userId }] }), {nonReactive: true});
		
		return [		
			AllResults.find({ $and: [{ race: {$in: racesArr}, userID: this.userId }] }, options),
			VirtualRaces.find({ race_name: {$in: racesArr}}, {fields: fields})		
		];
	};
})

// for submit run
Meteor.publish('getCurrentRaceAllResults', function() {			 
	let racesArr = [ {race: 'default non race'} ]	
	let fields = {
		'bib_number': 1, 
		'race': 1,
		'raceID': 1,
		'race_type': 1,
		'timing': 1,
		'timing_per_km': 1,
		'team': 1,
		'userID': 1,
		'user_name': 1,	
		'distance': 1,
		'category': 1	
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
		
			if ((today.getTime() <= endDate.getTime() && today.getTime() >= startDate.getTime())) 
				racesArr.push({race: raceName})						
		}
		
	})

	
	return AllResults.find({ $and: [{$or: racesArr}, { userID: this.userId }] }, {fields: fields});		
});

// for results ranking
Meteor.publish('getResultsByRace', function(values) { 	
	let { race, elite, category, team, gender, searchText, skipCount, limit } = values;
	var positiveIntegerCheck = Match.Where(function(x) {
    check(x, Match.Integer);
    return x >= 0;
  });
  check(skipCount, positiveIntegerCheck);	

  var filter = new RegExp(searchText, 'i');
  var options = {
		limit: limit,
		skip: skipCount,
		sort: {position: 1},
	};
	
	let categoryValue = category;
	let genderValue = gender;
	let eliteValue;
		
	var filterArray = [{ 'user_name': filter }, 
										 { 'bib_number': filter }]

	if (category == '')
		categoryValue = { $exists: true }
	if (gender == '')
		genderValue = { $exists: true }
	let findFilter = { race: race,
								 		 gender: genderValue,
								 		 category: categoryValue,
								 		 $or: filterArray }
	if (elite) {
		eliteValue = { $gt: 0 };
		findFilter = { race: race,
							 		 gender: genderValue,
							 		 category: categoryValue,
							 		 elite_position: { $gt: 0 },
							 		 $or: filterArray }
	} 

	var results = AllResults.find({ $and : [findFilter] }, options);	
	var userIds = [];
	results.map((result) => {
		if (Array.isArray(result.userID)) {
			_.each(result.userID, (id) => {
				userIds.push(id);
			})
		} else {
			userIds.push(result.userID);	
		}	    
  });	
	   
	// Count total count by results
	Counts.publish(this, 'allResultsCount', AllResults.find({race: race}), {nonReactive: true});
	Counts.publish(this, 'allResultsCategoryCount', AllResults.find({ $and : [findFilter] }), {nonReactive: true});
	return [
		VirtualRaces.find({race_name: race}),
		Meteor.users.find({_id: {$in: userIds}}, {fields: {'profile.name': 1, 'profilePic': 1, 'publicID': 1}}),
		results,
	]
});

// for badges showcase in public
Meteor.publish('publicUserBadges', function(publicID) {
	let results = AllResults.find({bib_number: publicID}).fetch();
	let resultsID = [],
			racesID = []
	_.each(results, (c) => {
		let { race_type, distance, category, raceID, _id } = c;
		if(race_type == 'virtual_race') {
			if(distance >= category) {
				racesID.push(raceID);
				resultsID.push(_id);
			}
		} else if (race_type == 'challenge') {
			if(distance >= 20) {
				racesID.push(raceID);
				resultsID.push(_id);
			}
		};
	});	

	Counts.publish(this, 'dataCount', AllResults.find({_id: {$in: resultsID}}), {nonReactive: true});

	return [
		AllResults.find({_id: {$in: resultsID}}, { sort: {createdAt: -1}, fields: {race: 1, distance: 1, category: 1, timing_per_km: 1, position: 1, elite_position: 1} }),
		VirtualRaces.find({_id: {$in: racesID}}, { fields: {badge_color: 1, race_name: 1, slug: 1, start_date: 1, end_date: 1} } ),
	]
});

// iOS
// user ranking for a run
Meteor.publish('getUserRankingInRace', function(race) {	
	return AllResults.find({race: race, userID: this.userId}, { sort: {position: 1} })
});

// user ranking for a run
Meteor.publish('getUserRankingInRaceUserData', function(race) {
	let userResult = AllResults.findOne({race: race, userID: this.userId});
	let userID = userResult.userID;

	return Meteor.users.find({_id: userID}, {fields: {'profile.name': 1, 'profilePic': 1, 'publicID': 1} })
});

// iOS
// for results ranking
Meteor.publish('getRankingInRace', function(race, limit, category, elite) {	
  var options = {
		limit: limit,		
		sort: {position: 1},
	};
	
	let findFilter = { race: race,	
								 		 category: category,
								 		}
	if (elite) {
		eliteValue = { $gt: 0 };
		findFilter = { race: race,							 		 
							 		 category: category,
							 		 elite_position: { $gt: 0 },
							 		}
	} 
	var results = AllResults.find({ $and : [findFilter] }, options);		
	   	
	return results;		
});

// for results ranking
Meteor.publish('getRankingInRaceUserData', function(race, limit, category, elite) {  
  var options = {
		limit: limit,		
		sort: {position: 1},
	};
	
	let findFilter = { race: race,	
								 		 category: category,
								 		}
	if (elite) {
		eliteValue = { $gt: 0 };
		findFilter = { race: race,							 		 
							 		 category: category,
							 		 elite_position: { $gt: 0 },
							 		}
	} 

	var results = AllResults.find({ $and : [findFilter] }, options);	
	var userIds = [];
	results.map((result) => {
		if (Array.isArray(result.userID)) {
			_.each(result.userID, (id) => {
				userIds.push(id);
			})
		} else {
			userIds.push(result.userID);	
		}	    
  });	
	   	
	return Meteor.users.find({_id: {$in: userIds}}, {fields: {'profile.name': 1, 'profilePic': 1, 'publicID': 1}});		
});