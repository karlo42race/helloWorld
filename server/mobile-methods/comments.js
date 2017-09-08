import { check, Match } from 'meteor/check';
import { Comments, Submissions } from '/imports/api/collections.js';

Meteor.methods({
	// get comments for one submission
	'comments.getOneSubmissionComments'(postID, limit, skipCount) {
		check(postID, String);
		check(limit, Number);
		check(skipCount, Number);

		let options = {
			limit,
			skip: skipCount,
			sort: {createdAt: -1},
		};

		let data = [];

		let comments = Comments.find({postID: postID}, options).fetch();		
		_.each(comments, (c) => {
			let oneData = c;
			let oneUser = Meteor.users.findOne({_id: c.userID});
			let profilePic = oneUser ? oneUser.profilePic : "";
			Object.assign(oneData, {
				profilePic
			});

			data.push(oneData);

		});
		
		return data;
	},
	
});
