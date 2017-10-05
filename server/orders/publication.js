import { check, Match } from 'meteor/check';
import { Orders } from '/imports/api/collections.js';

// for user dashboard single order details
Meteor.publish('oneRaceOrders', function(race) {	   
	return Orders.find({$and: [ {userID: this.userId}, {race: race} ] }, { sort: {createdAt: -1}});
});
