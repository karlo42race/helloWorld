import { check, Match } from 'meteor/check';
import {
	toMyr,
	toId,
	racePriceSg,
	racePriceMy,
	racePriceId
} from '../orders/modules/order-helpers';

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