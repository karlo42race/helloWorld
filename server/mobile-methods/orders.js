import { check, Match } from 'meteor/check';
import { Countries } from '/imports/api/collections.js';

const toMyr = 3.2;
const toId = 10000;
const racePriceSg = 9.90;
const racePriceMy = 29.90;
const racePriceId = 99900;

Meteor.methods({
	'orders.getCountriesOptions'() {
		let data = Countries.find({}).fetch();
		return data;
	},

	'orders.getCurrencyConversion'() {
 		let data = {
 			toMyr,
 			toId,
 			racePriceSg,
 			racePriceMy,
 			racePriceId,
 		};
 
 		return data;
 
 	},

});