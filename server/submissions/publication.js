import { check, Match } from 'meteor/check';
import { AllResults, Submissions, Comments, Following } from '/imports/api/collections.js';

Meteor.publish('publicSubmissions', function(limit, type) {
	var options = {
		limit: limit,		
		sort: {createdAt: -1},
	};
	
	if(type == 'feeds') {
		var submissions = Submissions.find({}, options);	

		var userIds = submissions.map(function (submission) {  	
	    return submission.userID;
	  });
		
		var commentsIDs = submissions.map(function (submission) {  	
	    return submission.comments;
	  });

	  Counts.publish(this, 'submissionsCount', Submissions.find({}), {nonReactive: true});
		return [
			Meteor.users.find({_id: {$in: userIds}}, {fields: {'profile.name': 1, 'profilePic': 1}}),
			Comments.find({_id: {$in: commentsIDs} }),
			submissions,
		]			
	}

	if(type == 'highlights') {
		var submissions = Submissions.find({photo_url: {$not: { $eq: ""}  } }, options);	

		var userIds = submissions.map(function (submission) {  	
	    return submission.userID;
	  });
		
		var commentsIDs = submissions.map(function (submission) {  	
	    return submission.comments;
	  });

	  Counts.publish(this, 'submissionsCount', Submissions.find({photo_url: {$not: { $eq: ""}  } }), {nonReactive: true});
		return [
			Meteor.users.find({_id: {$in: userIds}}, {fields: {'profile.name': 1, 'profilePic': 1}}),
			Comments.find({_id: {$in: commentsIDs} }),
			submissions,
		]			
	} 

	if(type == 'following') {
		var followings = Following.find({userID: this.userId});
	 	var idol_userIDs = followings.map(function (following) {  	
	    return following.idol_userID;
	  });

	  Counts.publish(this, 'submissionsCount', Submissions.find({userID: {$in: idol_userIDs} }, options), {nonReactive: true});

	  return [
			Meteor.users.find({_id: {$in: idol_userIDs}}, {fields: {'profile.name': 1, 'profilePic': 1}}),
			Submissions.find({userID: {$in: idol_userIDs} }, options),	
		]
	} 

});

Meteor.publish('oneSubmission', function(submissionID) {	
	let submission = Submissions.findOne({_id: submissionID});		
	let user;
	let fields = {
		'profile.name': 1, 
		'profilePic': 1, 
		'motto': 1, 
		'publicID': 1,
		'badges': 1
	}  

	if (submission) 
		user = Meteor.users.find({_id: submission.userID}, { fields: fields });			
	
	return [ user, Submissions.find({_id: submissionID}) ];

});

// get submissions by a user
Meteor.publish('userSubmissions', function(publicID, limit) {
	var options = {
		limit: limit,		
		sort: {createdAt: -1},
	};

	var submissions = Submissions.find({user_publicID: publicID}, options );
  var userIds = submissions.map((submission) => {
    return submission.userID;
  });

	// Count total count by submissions
	Counts.publish(this, 'submissionsCount', Submissions.find({user_publicID: publicID}), {nonReactive: true});
	return [
		Meteor.users.find({_id: {$in: userIds}}, {fields: {'profilePic': 1} }),
		submissions,
	]
});

// get user's one race submissions 
Meteor.publish('oneRaceSubmissions', function(race) {
	let oneResult = AllResults.findOne({userID: this.userId, race: race});
	
	let submissionsID = oneResult.submissions;	

	// Count total count by submissions
	Counts.publish(this, 'submissionsCount', Submissions.find({_id: {$in: submissionsID} }), {nonReactive: true});

	return Submissions.find({_id: {$in: submissionsID} });
})

// for iOS feeds - submissions
Meteor.publish('publicSubmissionsIos', function(limit, type) {
	var options = {
		limit: limit,		
		sort: {createdAt: -1},
	};

	if(type == 'highlights') {		
	  Counts.publish(this, 'submissionsCount', Submissions.find({photo_url: {$not: { $eq: ""}  } }), {nonReactive: true});
		return Submissions.find({photo_url: {$not: { $eq: ""}  } }, options);	
	} 

	if(type == 'following') {
		var followings = Following.find({userID: this.userId});
	 	var idol_userIDs = followings.map(function (following) {  	
	    return following.idol_userID;
	  });

	  Counts.publish(this, 'submissionsCount', Submissions.find({userID: {$in: idol_userIDs} }, options), {nonReactive: true});

	  return Submissions.find({userID: {$in: idol_userIDs} }, options);
	} 
});

// for iOS feeds - users
Meteor.publish('publicSubmissionsIosUsers', function(limit, type) {
	var options = {
		limit: limit,		
		sort: {createdAt: -1},
	};

	if(type == 'highlights') {
		var submissions = Submissions.find({photo_url: {$not: { $eq: ""}  } }, options);	

		var userIds = submissions.map(function (submission) {  	
	    return submission.userID;
	  });		
	  
		return Meteor.users.find({_id: {$in: userIds}}, {fields: {'profile.name': 1, 'profilePic': 1}});		
	} 

	if(type == 'following') {
		var followings = Following.find({userID: this.userId});
	 	var idol_userIDs = followings.map(function (following) {  	
	    return following.idol_userID;
	  });

	  return Meteor.users.find({_id: {$in: idol_userIDs}}, {fields: {'profile.name': 1, 'profilePic': 1}});
	};

});
