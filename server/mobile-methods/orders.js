import { check, Match } from 'meteor/check';
import { Countries } from '/imports/api/collections.js';

Meteor.methods({
	'orders.getCountriesOptions'() {
		let data = Countries.find({}).fetch();
		return data;
	},

});