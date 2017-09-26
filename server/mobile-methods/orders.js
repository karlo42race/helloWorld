import { check, Match } from 'meteor/check';
import { Countries } from '/imports/api/collections.js';

// to deprecate after getCountriesOptions are used;
import {
	toMyr,
	toId,
	racePriceSg,
	racePriceMy,
	racePriceId,
	selectCountry
} from '/imports/api/options.js';

Meteor.methods({
	'orders.getCountriesOptions'() {
		let data = Countries.find({}).fetch();
		return data;
	},

	// deprecate after countries method is used	
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