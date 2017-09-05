import { check, Match } from 'meteor/check';
import { Following } from '/imports/api/collections.js';

Meteor.methods({
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
		let oneFollowing = Following.find({'idol_publicID': user_publicID, 'userID': this.userId});
		let isFollowing = oneFollowing ? true : false;

		let fansCount = Following.find({'idol_publicID': user_publicID}).count();
		let idolCount = Following.find({'user_publicID': user_publicID}).count();		
		
		let data = oneUser;
		Object.assign(data, {
    	fansCount,
    	idolCount,
    	isFollowing    	
    });

    console.log(data);
  	return data;
	},
	
});
