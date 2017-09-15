import { check, Match } from 'meteor/check';
import { AllResults, Following, Notifications, UserMeta, VirtualRaces } from '/imports/api/collections.js';

Meteor.methods({
	// for client mobile app login via facebook method
  'users.appLoginWithFacebook'(token) {
  	try {
      const result = HTTP.call('GET', 'https://graph.facebook.com/v2.3/me?fields=id,name,email,picture&access_token=' + token);
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
			'roles': 1
		}
		let oneUserMeta = UserMeta.findOne({ userID: this.userId }, {fields: {} });
		let { total_distance, total_timing, submissions_count } = oneUserMeta;
		let oneUser = Meteor.users.findOne({ _id: this.userId }, { fields: oneUserFields });
		let fansCount = Following.find({'idol_userID': this.userId}).count();
		let idolCount = Following.find({'userID': this.userId}).count();	

		let data = oneUser;				
		
		// get badges url
		let results = AllResults.find({userID: this.userId}).fetch();
		let badges = [];

		_.each(results, (c) => {
			let { race_type, distance, category, raceID, _id } = c;
			if(race_type == 'virtual_race') {
				if(distance >= category) {
					let oneRace = VirtualRaces.findOne({_id: raceID});
					let badge = oneRace ? oneRace.badge_color : "";
					badges.push(badge);
				}
			} else if (race_type == 'challenge') {
				if(distance >= 20) {
					let oneRace = VirtualRaces.findOne({_id: raceID});
					let badge = oneRace ? oneRace.badge_color : "";
					badges.push(badge);
				}
			};						
		});	

		Object.assign(data, {
    	fansCount,
    	idolCount,
    	total_distance,
			total_timing,
			submissions_count,
			badges
    });

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
	
});
