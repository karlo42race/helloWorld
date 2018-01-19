import { check, Match } from 'meteor/check';
import { Comments, Submissions, Following } from '/imports/api/collections.js';

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
    'comments.getLikeList'(postID){
        let submissions = Submissions.findOne({_id: postID});
        let cheers = submissions.cheers;
        let fields = {
            'profile.name': 1,
            'profilePic': 1,
            'publicID': 1
        };
        let users = Meteor.users.find({_id: {$in: cheers}}, {fields: fields}).fetch();

        let followers = Following.find({'userID': this.userId}, {fields:{idol_userID: 1}}).fetch();
        let followersList = [];
        _.each(followers, (follow)=>{
            followersList.push(follow.idol_userID);
        });
        console.log(followersList)
        let likeList = {"follow": [], "following": []};
        _.each(users, (user)=>{
            if (followersList.indexOf(user._id)> -1)
                likeList.following.push(user);
            else
                likeList.follow.push(user);
        });
        return likeList;
    },
});
