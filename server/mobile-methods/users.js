import { check, Match } from 'meteor/check';
import { AllResults, Following, Notifications, UserMeta, VirtualRaces, Submissions } from '/imports/api/collections.js';

Meteor.methods({
	// for client mobile app login via facebook method
	'users.appLoginWithFacebook'(token) {
		console.log(`Logging: users.appLoginWithFacebook, token: ${token}`);

		try {
			const result = HTTP.call('GET', 'https://graph.facebook.com/v2.5/me?fields=id,name,email,picture&access_token=' + token);
			email = result['data']['email'];
			user = Accounts.findUserByEmail(email);
			if (user != null) {
				userId = user['_id'];
				var stampedLoginToken = Accounts._generateStampedLoginToken();
				Accounts._insertLoginToken(userId, stampedLoginToken);
				return stampedLoginToken;    
			} else {
				console.log(result);
				return result;
			};
		} 
		catch (e) {
			console.log(e);
			return false;
		};
	},

	// for public user profile
	'users.getPublicUserData'(publicID) {		
		let user_publicID = parseInt(publicID);
		let fields = {
			'profile.name': 1, 
			'profilePic': 1, 
			'motto': 1, 
			'publicID': 1,		
			'badges': 1			
		};

		let oneUser =  Meteor.users.findOne({publicID: user_publicID}, { fields: fields } );
		let oneFollowing = Following.findOne({'idol_publicID': user_publicID, 'userID': this.userId});

		let isFollowing = oneFollowing ? true : false;

		let fansCount = Following.find({'idol_publicID': user_publicID}).count();
		let idolCount = Following.find({'user_publicID': user_publicID}).count();		
		
		let data = oneUser;
		Object.assign(data, {
			fansCount,
			idolCount,
			isFollowing    	
		});

		return data;
	},
	// for user profile page
	'users.getOwnUserData'() {
		let oneUserFields = {
			'profile.name': 1, 
			'profilePic': 1, 
			'motto': 1, 
			'publicID': 1,
			'message': 1,
			'roles': 1,
			'bannerImg': 1,
			'address.country': 1,
		}
		let oneUserMeta = UserMeta.findOne({ userID: this.userId }, {fields: {} });
		let { total_distance, total_timing, submissions_count } = oneUserMeta;
		let oneUser = Meteor.users.findOne({ _id: this.userId }, { fields: oneUserFields });
		// let fansCount = Following.find({'idol_userID': this.userId}).count();
		// let idolCount = Following.find({'userID': this.userId}).count();

		let idolData = Following.find({'user_publicID': oneUser.publicID}); 
		let idolIds = idolData.map(function (c) {  	
			return c.idol_userID;
		});

		let fansData = Following.find({'idol_publicID': oneUser.publicID}); 
		let fansId = fansData.map(function (c) {  	
			return c.userID;
		});

		let fansCount = Meteor.users.find({_id: {$in: fansId}}).count();
		let idolCount = Meteor.users.find({_id: {$in: idolIds}}).count();


		let data = oneUser;				
		
		// get badges url
		let results = AllResults.find({userID: this.userId}).fetch();
		let badges = [];

		_.each(results, (c) => {
			let { race_type, distance, category, raceID, _id } = c;
			if(race_type == 'virtual_race') {
				if(distance >= category) {
					// deprecate after badges change
					let oneRace = VirtualRaces.findOne({_id: raceID});
					let badge = oneRace ? oneRace.badge_color : "";
					badges.push(badge);
				};
			} else if (race_type == 'challenge') {
				if(distance >= 20) {
					// deprecate after badges change
					let oneRace = VirtualRaces.findOne({_id: raceID});
					let badge = oneRace ? oneRace.badge_color : "";
					badges.push(badge);
				};
			};
		});
		let today = new Date();
		let currentRaces = VirtualRaces.find({end_date: { $gte: today }},  {sort: {end_date: -1} });

		let currentRacesFetched = currentRaces.fetch();
		let racesArr = [];
		_.each(currentRacesFetched, (race) => {
			racesArr.push(race.race_name);
		});
		let virtualRaces = [];
		let allResults = AllResults.find({ $and: [{ race: {$in: racesArr}, userID: this.userId }] }).fetch();
		_.each(allResults, (results, index)=>{
			let oneRace = VirtualRaces.findOne({_id: results.raceID});
			allResults[index]['badge_grey'] = oneRace.badge_grey;
			allResults[index]['badge_color'] = oneRace.badge_color;
			allResults[index]['bib_design'] = oneRace.bib_design;
			allResults[index]['slug'] = oneRace.slug;
			allResults[index]['cert_finish'] = oneRace.cert_finish;


		});
		if (allResults.length<2){
			virtualRaces = currentRacesFetched;
			virtualRaces = virtualRaces.splice(0, (2 - allResults.length));
		}else{
			allResults = allResults.slice(0,2);
		}
		let options = {
			limit: 10,
			sort: {createdAt: -1},
		};
		let submissions = Submissions.find({}, options).fetch();
		Object.assign(data, {
			fansCount,
			idolCount,
			total_distance,
			total_timing,
			submissions_count,
			allResults,
			virtualRaces,
			submissions,
			badges

		});
		return data;

	},

	'users.publicSearchUsers'(searchText, limit, skipCount) {
		var filter = new RegExp(searchText, 'i');
		let filterBy = { $or: [ 
			{ 'publicID': parseInt(searchText) }, 
			{ 'profile.first_name': filter }, 
			{ 'profile.last_name': filter }, 
			{ 'profile.name': filter }
			]}

			if (searchText == '') {
				filterBy = {_id: 1234}
			}

			let fields = {
				'profile.name': 1, 
				'profilePic': 1, 
				'emails.address':1,
				'phone':1,	
				'publicID': 1
			}
			var options = {
				limit: limit,		
				skip: skipCount,
				sort: {name: 1},
				fields: fields
			};	

		// Counts.publish(this, 'dataCount', Meteor.users.find(filterBy), {nonReactive: true});
		let data = Meteor.users.find( filterBy, options ).fetch();
		return  data;
	},

	// 'users.publicSearchUsers2'(value, limit) {
	// 	var filter = new RegExp(value, 'i');
 //  		filterInt = parseInt(value);
 //  		fields = { $or: [ 
	// 				  			{ 'emails.address': filter }, 
	// 				  			{ 'profile.name': filter }, 
	// 				  			{ 'publicID': filterInt } 
	// 							]}
	// 	var options = {
	// 		limit,		
	// 		sort: {'profile.name': -1},
	// 	};

	// 	// Counts.publish(this, 'dataCount', Meteor.users.find(fields), {nonReactive: true});
	// 	// let user_publicID = parseInt(publicID);
	// 	// return Meteor.users.find({ _id: this.userId }, {fields: {} });
 //  		return Meteor.users.find(fields, options).fetch();
	// },
	// return race details by badge_color url;
	'users.showCompleteBadge'(badge_color) {
		let oneRace = VirtualRaces.findOne({badge_color: badge_color});
		let { badge_grey, race_name, race_name_lang, race_type } = oneRace;
		let data = {
			badge_color,
			badge_grey,
			race_name,
			race_type,
			race_name_lang
		}; 
		return data;		

	},

	'users.getBadges'(publicID) {
		check(publicID, Number);
		let results = AllResults.find({bib_number: publicID}).fetch();
		let data = [];

		const pushData = (oneResult) => {
			let { race, race_type, distance, category, raceID, timing_per_km, position } = oneResult;
			let oneRace = VirtualRaces.findOne({_id: raceID});
			let badge = oneRace ? oneRace.badge_color : "";
			let oneData = {
				race,
				race_type,
				distance,
				category,
				timing_per_km,
				position,
				badge
			}
			data.push(oneData);			
		}

		// get result details and push as object
		_.each(results, (c) => {
			let { race, race_type, distance, category, raceID, timing_per_km, position } = c;
			if(race_type == 'virtual_race') {
				if(distance >= category) {
					pushData(c);
				}
			} else if (race_type == 'challenge') {
				if(distance >= 20) {
					pushData(c);
				}
			};						
		});	

		return data;

	},

	'users.getNotifications'(limit, skipCount) {
		check(skipCount, Number);
		check(limit, Number);

		let data = [];
		let options = {
			limit,
			skip: skipCount,
			sort: {createdAt: -1}
		};

		let notifications = Notifications.find({userID: this.userId}, options ).fetch();

		_.each(notifications, (c) => {
			let oneUser = Meteor.users.findOne({_id: c.notifier_userID});		
			let oneData = c;
			let profilePic = oneUser ? oneUser.profilePic : "";

			Object.assign(oneData, {
				profilePic
			});
			data.push(oneData);
		});
		
		// set notification flag to false
		Meteor.users.update({
			_id: this.userId
		}, {
			$set: {
				message: false				
			}
		})
		
		return data;
	},
	
	// get list of users from an array of userID, e.g. people who like a submission
	'users.getUsersFromArray'(userArray) {
		check(userArray, Array);

		let data = [];
		let fields = {
			"profile.name": 1,
			profilePic: 1,
			publicID: 1
		};

		_.each(userArray, (c) => {
			let oneUser = Meteor.users.findOne({_id: c}, { fields: fields });
			
			if(oneUser) 
				data.push(oneUser);			

		});

		return data;

	},

	'users.getProfileData'() {
		let currentUser = Meteor.users.findOne({_id: this.userId});

		if(!currentUser) 
			throw new Meteor.Error('no-user-found', 'No user found');

		let { profile, motto, publicID, phone, country_code, birthday } = currentUser;		
		let birthdayShow = birthday;
		if(birthday)
			birthdayShow = moment(birthday).format('DD/MM/YYYY')
		let data = {
			profile, 
			motto,
			publicID,
			phone, 
			country_code,
			birthday: birthdayShow
		}

		return data;

	},

	'users.getFollowers'(user_publicID, limit, path) {
		check(user_publicID, Number);
		check(limit, Number);
		check(path, String);
		if(path !== 'following' && path !== 'followers')
			throw new Meteor.Error('wrong-path', `Wrong path input: ${path}`);

		let data, userIDs;
		let options = {
			limit: limit,
			sort: {createdAt: -1},
		};

		if(path == 'following') {
			data = Following.find({'user_publicID': user_publicID}, options); 
			userIDs = data.map(function (c) {  	
				return c.idol_userID;
			});
		} else if(path == 'followers') {
			data = Following.find({'idol_publicID': user_publicID}, options); 
			userIDs = data.map(function (c) {  	
				return c.userID;
			});
		};
		
		data = Meteor.users.find({_id: {$in: userIDs}}, {fields: {'profile.name': 1, 'profilePic': 1, 'publicID': 1}}).fetch()  	

		return data;
	},
	'users.updateLanguage'(lang){
		Meteor.users.update({
			_id: this.userId
		}, {
			$set: {
				lang: lang
			}
		})
	},
	'users.getDashboardData'(){
		let racesArr = [];
		let currentRaces = {};
		let badgesData = [];
		let registeredApps = [];
		let racesFetched = VirtualRaces.find({ end_date: {$gte: new Date()} }, {sort: {start_date: -1} }).fetch();		
		_.each(racesFetched, (race) => {
			racesArr.push(race.race_name);
			currentRaces[race.race_name] = race;
		});
		let joinedRaces = AllResults.find({ $and: [{ race: {$in: racesArr}, userID: this.userId }] }).fetch();
		_.each(joinedRaces, (results, index)=>{
			let oneRace = currentRaces[results.race];
			
			delete currentRaces[results.race];
			joinedRaces[index]['badge_grey'] = oneRace.badge_grey;
			joinedRaces[index]['badge_color'] = oneRace.badge_color;
			joinedRaces[index]['end_date'] = oneRace.end_date;
		});
		let allResults = AllResults.find({bib_number: Meteor.user().publicID}).fetch();
		_.each(allResults, (result)=>{
			if (!isNaN(result.distance) && !isNaN(result.category) && parseInt(result.distance) >= parseInt(result.category)){
				badgesData.push(result.raceID);
			}
		})
		let user = UserMeta.findOne({userID: Meteor.user()._id});
		if (user)
			registeredApps = user.registered_apps
		let currentRacesArr = [];
		_.forEach(currentRaces, (value, key)=>{
			currentRacesArr.push(value);
		});
		return {"currentRaces": currentRacesArr, "joinedRaces": joinedRaces, "badges": VirtualRaces.find({_id: {$in: badgesData}}).fetch(), "registeredApps": registeredApps}
	},

	'users.joinedRaces' (type, limit = 3, page = 1) {

        let racesArr = [];
        let currentRaces = {};

        let  racesFetched = [];
        if ( type == 'current') {
            racesFetched = VirtualRaces.find({ end_date: {$gte: new Date()} }).fetch();
        } else if ( type == 'past') {
            racesFetched = VirtualRaces.find( { $and: [{ end_date: { $lt: new Date() }, end_date: { $lt: new Date() } }] } ).fetch();
        }  else {
            racesFetched = VirtualRaces.find({}).fetch();
        }

        _.each(racesFetched, (race) => {
            racesArr.push(race.race_name);
            currentRaces[race.race_name] = race;
        });

        let allResults = AllResults.find({ $and: [{ race: {$in: racesArr}, userID: this.userId }] }).fetch();

        let joinedRaces = [];
        _.each(allResults, (results, index)=>{
            let oneRace = currentRaces[results.race];
            joinedRaces[index] = {
                virtualRaces: oneRace,
                allResults: results,
                end_date: oneRace.end_date,
                date: new Date()
            };
        });


        let temp = {
            current: [],
            past: []
        };
        _.each(joinedRaces, (results, index)=>{
            if(results.end_date>new Date()){
                temp.current.push(results)
            } else {
                temp.past.push(results)
            }

        });

        temp.current.sort(function(a,b){
            return new Date(a.end_date) - new Date(b.end_date);
        });

        temp.past.sort(function(a,b){
            return new Date(a.end_date) - new Date(b.end_date);
        });

        joinedRaces = temp.current.concat(temp.past)

        let totalCount = joinedRaces.length;

        if (limit) {
            joinedRaces = joinedRaces.slice(((page - 1) * limit), page * limit)
        }

        return {data: joinedRaces, totalCount: totalCount};
	},

	'users.followCountByUserId' () {
		let user_publicID;
		let user = Meteor.users.findOne({_id: this.userId });
		console.log(Meteor.users);
		console.log(user);
		if(user) {
			user_publicID = user.publicID;
		}

		let userIDs = [];
		let follow = Following.find({'idol_publicID': user_publicID});
		userIDs = follow.map(function (user) {
			return user.userID;
		});

		follow = Meteor.users.find({_id: {$in: userIDs}}, {fields: {'profile.name': 1, 'profilePic': 1, 'publicID': 1}}).count();

		userIDs = []
		let following = Following.find({'user_publicID': user_publicID});
		userIDs = following.map(function (user) {
			return user.idol_userID;
		});

		following = Meteor.users.find({_id: {$in: userIDs}}, {fields: {'profile.name': 1, 'profilePic': 1, 'publicID': 1}}).count();



		return {
			follow: follow,
			following: following,
		};

	}
	
});
