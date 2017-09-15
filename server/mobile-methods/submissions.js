import { check, Match } from 'meteor/check';
import { AllResults, Submissions, Comments, Following } from '/imports/api/collections.js';

Meteor.methods({
	// for feeds and following
	'submissions.getPublicSubmissions'(skipCount, type) {
		let options = {
			limit: 10,
			skip: skipCount,
			sort: {createdAt: -1},
		};
		let data = [], submissions = [];

		const pushOneData = (c) => {
		 	let oneUser = Meteor.users.findOne({_id: c.userID});		 	
		 	let oneData = {
		 		_id: c._id,
		 		user_name: c.user_name, 
				userID: c.userID,
				user_publicID: c.user_publicID,
				distance: c.distance,
				hour: c.hour,
				min: c.min,
				sec: c.sec,
				timingInSec: c.timingInSec,
				timing_per_km: c.timing_per_km,
				journal: c.journal,
				photo_url: c.photo_url,
				url: c.url,
				likes: c.likes,
				cheers: c.cheers,
				summary_polyline: c.summary_polyline,
				comments: c.comments,
				createdAt: c.createdAt,
				profilePic: oneUser.profilePic				
		 	};
			
			data.push(oneData);
		};
		
		if(type == 'feeds') {
			submissions = Submissions.find({}, options).fetch();			
		} else if(type == 'highlights') {
			submissions = Submissions.find({photo_url: {$not: { $eq: ""}  } }, options).fetch();
		} else if(type == 'following') {
			let followings = Following.find({userID: this.userId});
		 	let idol_userIDs = followings.map(function (following) {  	
		    return following.idol_userID;
		  });

		  submissions = Submissions.find({userID: {$in: idol_userIDs} }, options).fetch();	
		};

		_.each(submissions, (c) => {
			pushOneData(c);
		}); 

		return data;
		
	},

	// for user's log and public user's log
	'submissions.getUserLog'(publicID, skipCount) {
		let options = {
			limit: 10,
			skip: skipCount,
			sort: {createdAt: -1},
		};		

		let submissions = Submissions.find({user_publicID: publicID}, options).fetch();

		return submissions;
	},

	// get one submission 
	'submissions.getOneSubmission'(submissionID) {
		check(submissionID, String);

		let oneSubmission = Submissions.findOne({_id: submissionID});
		if(oneSubmission) {
			let oneUser = Meteor.users.findOne({_id: oneSubmission.userID});
			let profilePic = oneUser ? oneUser.profilePic : "";

			Object.assign(oneSubmission, {
				profilePic
			});
			
			return oneSubmission;
		};

	},

})
