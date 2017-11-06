import { check } from 'meteor/check';
import { WebApp } from 'meteor/webapp';
import { HTTP } from 'meteor/http';
import { AllResults, Countries, Coupons, Orders, OrderNumber, ProductItems, VirtualRaces } from '/imports/api/collections.js';

import { OrderEmailToAdmin, OrderEmailToUser } from '../emails/order-emails'
import { 
	addonArrayFix,
	createChargeOnStripe,
	checkOrder,
	createOrder,
	checkPrice,
	checkResult,
	formatDate,
	getAddonText,
	getOrderNumber,
	createResult,
	returnProductItemStock,
	takeCouponStock,
	takeProductItemStock,
	takeProductItemStockByArray,
	takeStock,
	returnStockByOrderNum,
	sendEmailToAdmin,
	sendEmailToUser } from './modules/order-helpers';

// production key and url;
const xfersUserApi = "yGfmVQrAr1y9c_aytbZw4ZW4rfUxugMDJzdyRQTxXtc";
const xfersUrl = "https://id.xfers.com/api/v3";

// development sandbox key
// const xfersUserApi = "21Yk2GcY-z8eD_857t5g7mXbvgfaYc4xKdsxx1cGhXM";
// const xfersUrl = "https://sandbox-id.xfers.com/api/v3";

const createResultWithOrder = (oneOrder) => {

	let { race, raceID, userID, user_publicID, user_name, email, category, team } = oneOrder;	

	let oneRace = VirtualRaces.findOne({_id: raceID});			
	let { race_type, race_name } = oneRace;	

	let currentUser = Meteor.users.findOne({_id: userID});	

	let { profile } = currentUser;
	let gender = profile.gender;

	let resultExists = AllResults.findOne({$and: [{userID: userID}, {raceID: raceID}] });		

	if(resultExists) {
		console.log('Error: in createResultWithOrder, user', user_name, userID, 'already has result for', race_name);
	} else {			
		let raceData = oneRace;
		let values = {
			category,
			team,
			userID,
			email
		};
		console.log('creating result..');
		createResult(raceData, values, currentUser);
	};
};

const sendEmailWithOrderId = (orderId) => {
	let oneOrder = Orders.findOne({orderNum: parseInt(orderId) });
	if(!oneOrder)
		throw new Meteor.Error('no-order', `No order for id: ${orderId}`);

	let { race, raceID, email, userID, user_name } = oneOrder;
	let currentUser = Meteor.users.findOne({_id: userID});
	let raceData = VirtualRaces.findOne({_id: raceID});
	let orderTimestamp = formatDate(new Date());
	let orderNum = orderId;
	
	// need to add values;
	let values = oneOrder;	

	Email.send({
	  to: 'sales@42race.com',
	  from: "42Race <contact@42race.com>",
	  subject: `[42Race] New runner joins ${race}`,
	  html: OrderEmailToAdmin(currentUser, values, raceData, orderTimestamp, orderNum),
	});
	console.log('Orders: Email sent to admin');

	Email.send({
	  to: email,
	  from: "42Race <contact@42race.com>",
	  subject: `[42Race] You have joined ${race}`,
	  html: OrderEmailToUser(currentUser, values, raceData, orderTimestamp, orderNum),
	});
	console.log('Orders: Email sent to user', user_name);

};

Meteor.methods({
	'xfers.charge'(raceData, values, userData) {		
    this.unblock();
		
		let loggingData = {
			raceData: raceData,
			values: values,
			userData: userData
		};
		console.log('Logging: xfers charge:');
		console.log(loggingData);
		
		console.log('Xfers charge called');
		
		let userId = this.userId;
		values['userID'] = userId;
		values['status'] = 'pending';

		// let { address, address2, unit_number, country, postal } = values;
		// let addressDetails = `${address} ${address2} ${unit_number} ${country} ${postal}`;
		const orderNum = getOrderNumber();
		let { priceInCents, email, phone, currency, addonArray, country } = values;
		let { race_name } = raceData;
		let { first_name, last_name } = userData.profile;
		let desc = `Order for ${race_name} - order Id: ${orderNum}`;
		const IndoPrice = priceInCents / 100;		

		checkPrice(values, race_name); // check if price is correct
		
		// check email exists
		if(!email || (email == ''))
			throw new Meteor.Error('no-email', 'Error: no email, add email on your dashboard');

    try {
			const result = HTTP.call("POST", `${xfersUrl}/charges`, {
				headers: { 
					"X-XFERS-USER-API-KEY": xfersUserApi,
					ContentType: "application/json"
				},
				params: { 
					amount: IndoPrice, 
					currency: "IDR", 
					order_id: orderNum,
					redirect: "false",
					description: desc,
					customer: email,
					receipt_email: email,
					items: [{description: desc, name: desc, price: IndoPrice, quantity: 1}],
					meta_data: { firstname: first_name, lastname: last_name },
					// user_phone_no: "+6592989598",
					return_url: `https://web.42race.com/order/complete/${race_name}`,
					notify_url: "https://web.42race.com/api/order/confirm",
					cancel_url: `https://web.42race.com/test/order/cancel/${orderNum}`
				}
			});
			if(result) {
				if(result.statusCode == 200) {
					console.log('charge went through, create order');
					
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

					let checkout_url = result.data.checkout_url;
					// take stock for VR category
					takeStock(raceData, values);

					// for promoCode
					let coupon_type;
					if(values.promoCode && values.promoCode !== '') {
						let oneCoupon = Coupons.findOne({coupon_code: values.promoCode});
						if(oneCoupon) {
							coupon_type = oneCoupon.type;
							takeCouponStock(oneCoupon._id);
						} else {
							throw new Meteor.Error('no-coupon', 'Error: coupon not found');
						};
					};
					values.coupon_type = coupon_type;
					// end for promoCode
					
					// create order with pending status
					createOrder(raceData, values, userData, orderNum, checkout_url);
				};
			}		

			console.log('result status code is:', result.statusCode);

			return result;
    } catch(e) {
    	console.log('Error:', e);
    	return false;
    }
	},

	'xfers.test'(orderId) {
		let oneOrder = Orders.findOne({orderNum: parseInt(orderId) });
		console.log('order is', oneOrder);		
		let { race, raceID, userID, user_publicID, user_name, email, category, team } = oneOrder;
		let notCancelled = Orders.findOne({ userID: userID, raceID: raceID, status: {$ne: 'cancelled'} });
		console.log('not cancelled is', notCancelled);

	},

});
