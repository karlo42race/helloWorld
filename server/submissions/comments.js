import { check, Match } from 'meteor/check';
import { Comments, Submissions } from '/imports/api/collections.js';

Meteor.publish('onePostComments', function(postID, limit) {
	var options = {
		limit,
		sort: {createdAt: -1},
	};
	var comments = Comments.find({postID: postID}, options);	
	var userIds = comments.map((comment) => {
    return comment.userID;
  });
	
	// Count total count by comments
	Counts.publish(this, 'commentsCount', Comments.find({postID: postID}), {nonReactive: true});
  return [
		Meteor.users.find({_id: {$in: userIds}}, {fields: {'profilePic': 1} }),
		comments,
	]

});


// METHODS
Meteor.methods({
	// userID and user_publicID belongs to author of comment
	'comments.insert'(postID, post_userID, post_user_publicID, userID, user_publicID, user_name, comment, likes_num, likes_user, post_type) {
		Comments.insert({
			postID,
			post_userID,
			post_user_publicID,
			userID,
			user_publicID,
			user_name,			
			comment,
			likes_num, 
			likes_user,
			createdAt: new Date()
		}, (err, res) => {
			if (err) {
				console.log(err)
			} else {				
				// add comment ID to submission if post type is submission
				if (post_type == 'submission'){
					// add commentID into submission data
					Submissions.update(
					{_id: postID}, {
						$push: {
							comments: res
						}
					});
				}
				
			}
		});
		console.log('Comments: insert comment for postID: ', postID, ' by ', user_name);
	},


	// Add like to comment
	'comments.addLike'(commentID, userID) {
		console.log('Comments: adding like for ', commentID, 'by', userID, '..');		
		let comment = Comments.findOne({_id: commentID});
		if (comment.likes_user) {
			if (comment.likes_user.indexOf(userID) > -1) {
				throw new Meteor.Error('duplicate likes', 'Ops, you have already liked this');
			}
		}
		Comments.update(
			{_id: commentID},
			{ $push: {
        	likes_user: userID
      	} 
      },
		)
		let likesArray = comment.likes_user;
				likesCount = parseInt(likesArray.length) + 1;

		console.log('Comments: adding like for ', commentID, 'by', userID, 'complete');
		Comments.update(
			{_id: commentID},
			{ $set: {
        	likes_num: likesCount
      	} 
      },
		)		
	},

	// Unlike comment
	'comments.unLike'(commentID, userID) {
		console.log('Comments: stop like for ', commentID, 'by', userID, '..');		
		let comment = Comments.findOne({_id: commentID});
		if (comment.likes_user) {
			if (comment.likes_user.indexOf(userID) < 0) {
				throw new Meteor.Error('did-not-like', 'Error');
			}
		}
		Comments.update(
			{_id: commentID},
			{ $pull: {
        	likes_user: userID
      	} 
      },
		)
		let likesArray = comment.likes_user;
				likesCount = parseInt(likesArray.length) - 1;
		console.log('Comments: stop like for ', commentID, 'by', userID, 'complete');
		Comments.update(
			{_id: commentID},
			{ $set: {
        	likes_num: likesCount
      	} 
      },
		)		
	},

	// Delete comment
	'comments.delete'(commentID, postID) {
		let oneComment = Comments.findOne({_id: commentID});
		// check comment belong to user
		if (oneComment.userID !== this.userId) {
			console.log('Error: Attempt to delete comment but user is not owner');
			throw new Meteor.Error('not-user', 'Error: not allowed');
		} else {
			Comments.remove({_id: commentID});
			
			// find submissions with commentID 
			let oneSubmission = Submissions.find({comments: commentID}).fetch();
			_.each(oneSubmission, (c) => {
				// remove comment from submission data;
				Submissions.update(
				{_id: c._id}, {
					$pull: {
						comments: commentID
					}
				});	
			});
			
			console.log('Comment deleted');
		}
	},


});
