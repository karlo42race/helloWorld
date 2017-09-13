import { check, Match } from 'meteor/check';
import {
	toMyr,
	toId,
	racePriceSg,
	racePriceMy,
	racePriceId,
	selectCountry
} from '/imports/api/options.js';

Meteor.methods({	
	'orders.getCurrencyConversion'() {		
		let data = {
			toMyr,
			toId,
			racePriceSg,
			racePriceMy,
			racePriceId,
			selectCountry
		};

		return data;

	},

});