import { check, Match } from 'meteor/check';
import { VirtualRaces, Orders, AllResults, ProductItems, Teams } from '/imports/api/collections.js';

Meteor.publish('currentVirtualRaces', function() {
	// current race	
	// end date of race is more than today
	return VirtualRaces.find({ end_date: {$gte: new Date()} }, {sort: {start_date: -1} })
})

Meteor.publish('pastVirtualRaces', function(limit) {
	var options = {
		limit: limit,		
		sort: {start_date: -1},
	};
	// past races
	// end date of race is less than today
	Counts.publish(this, 'pastRacesCount', VirtualRaces.find({ end_date: {$lt: new Date()} }), {nonReactive: true});
	return VirtualRaces.find({ end_date: {$lt: new Date()} }, options)
})

// publish the virtual race data based on slug
Meteor.publish('oneVirtualRace', function(slug) {	
	let virtualRace = VirtualRaces.findOne({slug: slug});
	let race, raceID;
	if(virtualRace) {
		race = virtualRace.race_name;	
		raceID = virtualRace._id;
	}
	
	Counts.publish(this, 'orderCount', Orders.find({'race': race, 'status': 'paid'}), {nonReactive: true});
	return [
		Orders.find({$and: [
				{'userID': this.userId}, 
				{race: race}, 
				{status: {$ne: 'cancelled'} }
			] 
		}, { fields: {'orderNum': 1, 'status': 1, createdAt: 1 } }),
		VirtualRaces.find({slug: slug}, {limit: 1}),
		ProductItems.find({$or: [{race: race}, {race: 'all'}] }),
		Teams.find({raceID: raceID}, {limit: 10, sort: {position: 1} } )
	]
})

// publish the virtual race data based on race name
Meteor.publish('oneVirtualRaceByName', function(race) {				
	return VirtualRaces.find({race_name: race});	
});

// for downloading of bib
Meteor.publish('raceBib', function(race) {
	return [
		VirtualRaces.find({race_name: race}, {limit: 1}),
		AllResults.find({$and: [{race: race}, {userID: this.userId}] })
	]
});

Meteor.publish('racesForCalendar', function( month, year ) {
	// e.g. month = 5; year = 2017 
	let start_month = parseInt(month) - 2;
	let start_year = year;
	if(start_month < 1) {
		start_month = start_month + 12;
		start_year = parseInt(year) - 1;
	}
	// start_month = 3; year = 2017;

	let end_month = parseInt(month) + 3;
	let end_year = year;
	if(end_month > 12) {
		end_month = end_month - 12;
		end_year = parseInt(year) + 1;
	}
	// end_month = 8; year = 2017 
	// => get races with start date or end date between 1/3/2017 to 1/8/2017;
	
	let start_date_string = `${start_year}-${start_month}-01`;
	let start_date = moment(start_date_string, 'YYYY-MM-DD').toDate();
	// let start_date = moment( (start_month - 1), "MM")

	let end_date_string = `${end_year}-${end_month}-01`;
	let end_date = moment(end_date_string, 'YYYY-MM-DD').toDate();
	
	let fields = {
		fields: {
			badge_grey: 1, badge_color: 1, race_name: 1, start_date: 1, end_date: 1, race_type: 1, hide_banner_on_dashboard: 1 
		} 
	}
	console.log(start_date, end_date);
	return VirtualRaces.find({
		$or: [
			{$and: [ {start_date: {$gte: start_date} }, {start_date: {$lte: end_date} } ] },
		  {$and: [ {end_date: {$gte: start_date} }, {end_date: {$lte: end_date}  } ] } 
		]
	}, fields);
}) 

// testing for publishing teams count
Meteor.publish('testResult', function(slug) {
	let virtualRace = VirtualRaces.findOne({slug: slug});
	let race;
	if(virtualRace)
		race = virtualRace.race_name;	
	
	Counts.publish(this, 'getTestTeam', AllResults.find({race: race}), {nonReactive: true});
	return AllResults.find({race: race})
})
