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

 	'orders.createFrmMobile'(raceData, currentUser, values, token) {
		
		let loggingData = {raceData, currentUser, values, token};
		console.log(`Logging: orders create`);
		console.log(loggingData);
				
		let { race_name } = raceData;
		let { email, priceInCents, currency, addonArray, country, unit_number } = values;
		let { profile } = currentUser;
		let userId = this.userId;
		console.log('Orders: charging card for race: ', race_name, 'for user: ', email);
		
		checkProfile(profile);
		// check country exists
		if(!country || (country == ''))
			throw new Meteor.Error('no-country', 'Error: no country, add country on param');
		// check email exists
		if(!email || (email == ''))
			throw new Meteor.Error('no-email', 'Error: no email, add email on your dashboard');

		if (unit_number === null || !unit_number) {
			unit_number = "";
		}
		var matchesHash = unit_number.split("#").length - 1;
		var matchesDash = unit_number.split("-").length - 1;
		if (matchesHash === 0) {
			unit_number = "#"+unit_number;
		}
		if (matchesDash === 0) {
			unit_number +="-";
		}
		// console.log(unit_number);
		check(token.id, String); // check stripeToken is string
		checkOrder( userId, raceData );	// check if user has register for race
		checkAddonCountry(addonArray, values, race_name); // check if addon can be delivered to shipping country
		checkPrice(values, race_name); // check if price is correct

		let orderTimestamp = formatDate(new Date());		
    let orderNum = getOrderNumber(); // get order number 

    return createChargeOnStripe({
      source: token.id,
      amount: priceInCents, // this is equivalent to $9.90
      currency: currency,
      description: `Charge for ${race_name} order no: #${orderNum} - 42Race`,
      receipt_email: email
    })
		.then((charge) => {
			console.log('Stripes: success charge is', charge.outcome);
  		console.log('Orders: Inserting order for', race_name, 'by', profile.name); 		
			
			// add status of payment to paid
			values['status'] = 'paid';
			let checkout_url = null;
			let addonText = '';			
			// check if there is addon
			if(addonArray && addonArray.length > 0) {
				// add on stuff							
				takeProductItemStockByArray(addonArray, race_name);
				let addonText = getAddonText(addonArray, country, race_name);	

				// fix addon array index;
				let addonArrayFixed = addonArrayFix(addonArray, race_name);			
				
				// add addonArray and addonText to values
				values['addonArray'] = addonArrayFixed;
				values['addOn'] = addonText;				
			}; 
			// end addon check			

			// for promoCode
			let coupon_type;
			if(values.promoCode && values.promoCode !== '') {
				let oneCoupon = Coupons.findOne({coupon_code: values.promoCode});
				if(oneCoupon) {
					coupon_type = oneCoupon.type;
					takeCouponStock(oneCoupon._id);
				} else {
					throw new Meteor.Error('no-coupon', 'Error: no such coupon');
				};
			};
			values.coupon_type = coupon_type;			
			// end for promoCode
			
			values['userID'] = userId;
			// create order
			// call twice if partner run
			createOrder(raceData, values, currentUser, orderNum, checkout_url);			

			Meteor.defer(() => {				

				takeStock(raceData, values); // minus stock for race category;
				// 4. RESULTS - create
				createResult(raceData, values, currentUser);
				// 5. SEND EMAIL				
				sendEmailToAdmin(OrderEmailToAdmin, currentUser, values, raceData, orderTimestamp, orderNum); // send email to admin				
				sendEmailToUser(OrderEmailToUser, currentUser, values, raceData, orderTimestamp, orderNum); // send email to user
			});						

			return charge;
  	})
		.catch((error) => {
			throw new Meteor.Error('charge-denied', `${error}`);
		});

	},

});