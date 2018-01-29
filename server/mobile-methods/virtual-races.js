import { check, Match } from 'meteor/check';
import { Orders, ProductItems, Teams, VirtualRaces, AllResults, Following } from '/imports/api/collections.js';

Meteor.methods({
	'virtualRaces.getOneRace'(slug) {
		check(slug, String);

		let oneRace = VirtualRaces.findOne({slug: slug}, { fields: {'team': 0} });
		if (!oneRace.free_race) {
		    oneRace['free_race'] = "N";
        }
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
		let orders = Orders.find({'race': race, 'status': 'paid'}, {fields:{userID:1}});
		let orderCount = orders.count();
		let productItems = ProductItems.find({$or: [{race: race}, {race: 'all'}] }).fetch();
		let teams = Teams.find({raceID: raceID}, {limit: 10, sort: {position: 1} } ).fetch();

		let data = oneRace;

        let orderUsers = _.uniq(orders.fetch().map(function(x) {
            return x.userID;
        }), true);
        let fields = {
            'profile.name': 1,
            'profilePic': 1,
            'publicID': 1
        };
		Object.assign(data, {
    	teams,
    	productItems,
    	orderCount,
    	order: oneOrder,
		runners: Meteor.users.find({_id: {$in: orderUsers} }, { fields: fields, limit: 10 } ).fetch()
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
			raceComingSoonPic: "https://virtual-race-submissions.s3-ap-southeast-1.amazonaws.com/images/hourglass-200x200-png-93j29092017-155157",
			raceOngoingPic: "https://virtual-race-submissions.s3-ap-southeast-1.amazonaws.com/images/runningman-200x200-png-vht29092017-155157",
			raceEndedPic: "https://virtual-race-submissions.s3-ap-southeast-1.amazonaws.com/images/hotair-balloon-200x200-png-wdw29092017-155157",
			races
		}

		return data;

	},
	'virtualRaces.currentVirtualRaces'(){
        return VirtualRaces.find({ end_date: {$gte: new Date()} }, {sort: {start_date: -1} }).fetch()
    },
	'virtualRaces.pastVirtualRaces'(limit){
        let options = {
            limit: limit,
            sort: {start_date: -1},
        };
        return VirtualRaces.find({ end_date: {$lt: new Date()} }, options).fetch()
	},
	'virtualRaces.runnerForRace'(raceID){
        let orders = _.uniq(Orders.find({raceID: raceID}, {
            fields: {userID: 1}
        }).fetch().map(function(x) {
            return x.userID;
        }), true);
        let fields = {
            'profile.name': 1,
            'profilePic': 1,
            'publicID': 1
        };
        return Meteor.users.find({_id: {$in: orders} }, { fields: fields } );
	},
    'virtualRaces.runnerForRaceWithSkipCount'(raceID, skipCount) {
        let fields = {
            'profile.name': 1,
            'profilePic': 1,
            'publicID': 1
        };
		let options = {
            limit: 10,
            skip: skipCount,
            sort: {createdAt: -1},
			fields: fields
        };
        let orders = _.uniq(Orders.find({raceID: raceID}, {
            fields: {userID: 1}
        }).fetch().map(function(x) {
            return x.userID;
        }), true);

        let users = Meteor.users.find({_id: {$in: orders} }, options).fetch();
        _.each(users, (user, index)=>{
            let follow = Following.findOne({'userID': this.userID, 'idol_userID': user._id}, {fields:{idol_userID: 1}});
            if(follow)
            	users[index]["follow"] = "following";
            else
            	users[index]["follow"] = "follow";

        });
        return users;
    },
    'virtualRaces.getRaceData'(raceType){
        let virtualRaceCondition;
        let today = new Date();
        if (raceType === 'current'){
            virtualRaceCondition = { end_date: {$gte: today }};
        }
        else if (raceType ==='past'){
            virtualRaceCondition = { end_date: {$lt: today }};
        }
        else{
            return false;
        }
        let raceData = [];
        let races = VirtualRaces.find(virtualRaceCondition,  {sort: {end_date: -1} });
        let racesFetched = races.fetch();
        let racesArr = [];
        let allResultVirtualRace = {};
        _.each(racesFetched, (race) => {
            racesArr.push(race.race_name);
            allResultVirtualRace[race.race_name] = race;
        });
        let allResults = AllResults.find({ $and: [{ race: {$in: racesArr}, userID: this.userId }] }).fetch();
        _.each(allResults, (results, index)=>{
            let oneRace = allResultVirtualRace[results.race];
            delete allResultVirtualRace[results.race];
            allResults[index]['badge_grey'] = oneRace.badge_grey;
            allResults[index]['badge_color'] = oneRace.badge_color;
            allResults[index]['end_date'] = oneRace.end_date;
            allResults[index]['bib_design'] = oneRace.bib_design;
            allResults[index]['slug'] = oneRace.slug;
            allResults[index]['cert_finish'] = oneRace.cert_finish;


        });
        _.each(allResultVirtualRace, (race)=>{
            raceData.push(race)
        });
        raceData =  [...raceData, ...allResults];
        raceData.sort(function(a,b){
            return b.end_date - a.end_date;
        });
        return raceData;
    }

});


