import { check, Match } from 'meteor/check';
import { Orders, ProductItems, Teams, VirtualRaces } from '/imports/api/collections.js';

Meteor.methods({
	'virtualRaces.getOneRace'(slug) {
		check(slug, String);

		let oneRace = VirtualRaces.findOne({slug: slug}, { fields: {'team': 0} });		
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

	'virtualRaces.getRacesInCurrentMonth'() {
		let today = new Date(), y = today.getFullYear(), m = today.getMonth();;
		let firstDayOfMonth = new Date(y, m, 1);
		let lastDayOfMonth = new Date(y, m + 1, 0);

		let races = [];

		let currentMonthRaces = VirtualRaces.find({ $or: [
				{start_date: {
					$gte: firstDayOfMonth,
        	$lt: lastDayOfMonth
				}},
				{end_date: {
					$gte: firstDayOfMonth,
        	$lt: lastDayOfMonth
				}}
			]
		}).fetch();

		_.each(currentMonthRaces, (c) => {			
			let { start_date, end_date, race_name, race_name_lang, race_type, raceID } = c;
			let new_start_date = start_date, new_end_date = end_date;
			if(start_date.getMonth() !== m) 
				new_start_date = firstDayOfMonth;
			if(end_date.getMonth() !== m)
				new_end_date = lastDayOfMonth;

			let oneData = {
				raceID,
				race_name,
				race_name_lang,
				race_type,
				start_date: new_start_date,
				end_date: new_end_date
			};

			races.push(oneData);
		});		

		let data = {
			currentMonth: moment(today).format('M'),
			currentYear: moment(today).format('Y'),
			raceComingSoonPic: "https://joomlaforce.com/wp-content/uploads/2017/02/coming-soon-page-builder.png",
			raceOngoingPic: "http://3.bp.blogspot.com/-No6eURCs50k/TWDvbIHLHVI/AAAAAAAAAR8/0QVffJ2jqI8/s1600/checkered+flag+hand.jpg",
			raceEndedPic: "https://t4.ftcdn.net/jpg/00/36/53/91/500_F_36539132_d030gU4ywLB6LqeYd75ZOiX0RGaJAcke.jpg",
			races
		}

		return data;

	},

})


