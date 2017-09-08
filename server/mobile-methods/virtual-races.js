import { check, Match } from 'meteor/check';
import { Orders, ProductItems, Teams, VirtualRaces } from '/imports/api/collections.js';

Meteor.methods({
	'virtualRaces.getOneRace'(slug) {
		check(slug, String);

		let oneRace = VirtualRaces.findOne({slug: slug}, { fields: {'team': 0} });
		console.log(oneRace);
		let race, raceID;
		if(oneRace) {
			race = oneRace.race_name;
			raceID = oneRace._id;
		};
		
		let oneOrder = Orders.findOne({$and: [
				{'userID': this.userId}, 
				{race: race}, 
				{status: {$ne: 'cancelled'} }
			] 
		}, { fields: {'orderNum': 1, 'status': 1, createdAt: 1 } });
		
		let orderCount = Orders.find({'race': race, 'status': 'paid'}).count();
		let productItems = ProductItems.find({$or: [{race: race}, {race: 'all'}] }).fetch();
		let teams = Teams.find({raceID: raceID}, {limit: 10, sort: {position: 1} } ).fetch();

		let data = oneRace;

		Object.assign(data, {
    	teams,
    	productItems,
    	orderCount,
    	order: oneOrder    	
    });

    return data;
		
	},

})


