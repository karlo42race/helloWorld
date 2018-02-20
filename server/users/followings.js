import { check, Match } from 'meteor/check';
import { Following } from '/imports/api/collections.js';

Meteor.publish('followCountByUserId', function() {	
	let user_publicID;
	let user = Meteor.users.findOne({_id: this.userId });	
	if(user)
		user_publicID = user.publicID;

	// how many people follow userID
	Counts.publish(this, 'fansCount', Following.find({'idol_publicID': user_publicID}) );

	// how many people userID follow
	Counts.publish(this, 'idolCount', Following.find({'user_publicID': user_publicID}), {nonReactive: true} );	
});

// used in user profile layout
Meteor.publish('followCheck', function(idol_publicID) {	
	// check if user has followed
	return Following.find({'idol_publicID': idol_publicID, 'userID': this.userId});	
});

// used to check if user follow in list of users
Meteor.publish('followCheckByUserId', function() {	
	// check if user has followed
	return Following.find({'userID': this.userId});	
});

// used in user profile layout
Meteor.publish('followCount', function(user_publicID) {	
	// how many people follow userID
	Counts.publish(this, 'fansCount', Following.find({'idol_publicID': user_publicID}) );

	// how many people userID follow
	Counts.publish(this, 'idolCount', Following.find({'user_publicID': user_publicID}), {nonReactive: true} );	
});

// used in user profile layout
Meteor.publish('oneUserFollow', function(user_publicID, limit, path) {	
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
	} else {
		data = Following.find({'idol_publicID': user_publicID}, options); 
		userIDs = data.map(function (c) {  	
	    return c.userID;
	  });
	}

  Counts.publish(this, 'dataCount', data, {nonReactive: true});
  return [
  	data,
  	// Following.find({userID: this.userId}),
  	Meteor.users.find({_id: {$in: userIDs}}, {fields: {'profile.name': 1, 'profilePic': 1, 'publicID': 1}})  	
  ]

});

Meteor.methods({
	// userID and user_publicID belongs to author of comment
	'following.insert'(idol, currentUser) {
		let userID = currentUser._id,
				user_publicID = currentUser.publicID,
				idol_userID = idol._id,
				idol_publicID = idol.publicID;

		Following.insert({
			userID,
			user_publicID,
			idol_userID,
			idol_publicID,
			createdAt: new Date()
		});
		console.log('Following: user ', user_publicID, ' followed ', idol_publicID);
	},

	'following.follow'(idol, currentUser) {
		let { userID, user_publicID} = currentUser;
		let { idol_userID, idol_publicID} = idol;

		Following.insert({
			userID,
			user_publicID,
			idol_userID,
			idol_publicID,
			createdAt: new Date()
		});
		console.log('Following: user ', user_publicID, ' followed ', idol_publicID);
	},		

	'following.remove'(userID, idol_publicID) {
		let following = Following.findOne({'idol_publicID': idol_publicID, 'userID': userID});	
		Following.remove(following._id);		

		console.log('Following: user ', userID, ' stop following ', idol_publicID);
	},	
});
