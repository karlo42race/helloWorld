import { check, Match } from 'meteor/check';
import { Notifications, Submissions, Comments } from '/imports/api/collections.js';

Meteor.methods({
	'notifications.insert'(postID, notifier_userID, post_type, action_type, message, toUserID) {	
		console.log('Notifications: adding notifications by', notifier_userID, '..');	
		
		// for testing
		console.log('check: ', postID, notifier_userID, post_type, action_type, message, toUserID);

		let notifier_publicID, notifier_user_name, user_publicID;		
		
		var userB = Meteor.users.findOne({_id: notifier_userID}); // userB
		if (userB) {
			notifier_publicID = userB.publicID; // userB's publicID
			notifier_user_name = userB.profile.name; // userB's name
		}

		// change postID to comment.postID instead of commentID if it is a comment notification
		// userB like userA's comment, post_type = 'comment', action_type = 'like'
		if (post_type == 'comment' && action_type == 'like') {
			let comment = Comments.findOne({_id: postID});
			postID = comment.postID; // id of the post of the comment;
			userID = comment.userID; // userA's id
			user_publicID = comment.user_publicID; // userA's publicID
		}

		// userB comments on userA's submission, post_type = 'submission', action_type = 'comment' or 'like'
		if (post_type == 'submission') {
			let submission = Submissions.findOne({_id: postID});
			postID = postID; 							// id of the post;
			userID = submission.userID; 	// userA's id
			user_publicID = submission.user_publicID; // userA's publicID
		}
		
		// userB follows userA, post_type = 'following', action_type = 'follow'
		// postID is userA's publicID, need to change to userB's publicID
		if (post_type == 'following' && action_type == 'follow') {			
			let userA = Meteor.users.findOne({publicID: postID});					
			postID = notifier_publicID; 						// publicID of the userB;
			userID = userA._id; 										// userA's id
			user_publicID = userA.publicID; 				// userA's publicID
		}
		
		if (post_type == 'comment' && action_type == 'reply') {
			console.log('replying to a comment');
			let userC = Meteor.users.findOne({_id: toUserID});
			userID = toUserID;
			user_publicID = userC.publicID;
		}
		console.log('notifierID', notifier_userID, 'userID', userID);
		// user liking/ commenting/ replying on his own post
		if (notifier_userID == userID) {
			return console.log('Notifications: not added, user acting on own assets');
		}
		Notifications.insert({
			postID, // postID that comment is on
			notifier_userID, // user that is commenting
			notifier_publicID, // user that is commenting
			notifier_user_name, // user that is commenting
			userID, // user that is commented on/receive notification
			user_publicID, // user that is commented on/receive notification
			post_type, 		// 'comment / submission'
			action_type, 	// 'like / comment'
			message,
			read: false,
			createdAt: new Date()
		});

		Meteor.users.update({
			_id: userID
		}, {
			$set: {
				message: true				
			}
		});

		console.log('Notifications: user:', notifier_user_name, message, ' of user:', user_publicID);		
	},

	// Notification read
	'notification.read'(notificationID) {
		console.log('Notication: read', notificationID);
		Notifications.update(
		{_id: notificationID},
			{ $set: {
					read: true
      	} 
      },
		)
	},

})

