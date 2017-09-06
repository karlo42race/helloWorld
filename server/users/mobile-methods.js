import { check, Match } from 'meteor/check';
import { Following, UserMeta } from '/imports/api/collections.js';

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
			'badges': 1,
			'roles': 1
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
			'message': 1			
		}
		let oneUserMeta = UserMeta.findOne({ userID: this.userId }, {fields: {} });
		let { total_distance, total_timing, submissions_count } = oneUserMeta;
		let oneUser = Meteor.users.findOne({ _id: this.userId }, { fields: oneUserFields });
		let fansCount = Following.find({'idol_userID': this.userId}).count();
		let idolCount = Following.find({'userID': this.userId}).count();	

		let data = oneUser;
		Object.assign(data, {
    	fansCount,
    	idolCount,
    	total_distance,
			total_timing,
			submissions_count
    });

    return data;

	},
	
});
