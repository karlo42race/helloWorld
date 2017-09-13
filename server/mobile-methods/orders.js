import { check, Match } from 'meteor/check';

const toMyr = 3.2;
const toId = 9900;
const racePriceSg = 9.90;
const racePriceMy = 29.90;
const racePriceId = 99900;

Meteor.methods({	
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