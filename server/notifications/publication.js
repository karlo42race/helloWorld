import { check, Match } from 'meteor/check';
import { Notifications } from '/imports/api/collections.js';

Meteor.publish('userNotifications', function(limit) {
	var options = {
		limit: limit,		
		sort: {createdAt: -1},
	};

	var notifications = Notifications.find({userID: this.userId}, options );
  var notifier_userIDs = notifications.map(function (notification) {
    return notification.notifier_userID;
  });

	// Count total count by notifications
	Counts.publish(this, 'notificationsCount', Notifications.find({userID: this.userId}), {nonReactive: true});
	return [
		Meteor.users.find({_id: {$in: notifier_userIDs}}, {fields: {'profilePic': 1} }),
		notifications,
	]
});
