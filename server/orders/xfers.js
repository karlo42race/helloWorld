import { check } from 'meteor/check';
import { WebApp } from 'meteor/webapp';
import { HTTP } from 'meteor/http';
import { Orders, OrderNumber, ProductItems, AllResults, VirtualRaces } from '/imports/api/collections.js';

import { OrderEmailToAdmin, OrderEmailToUser } from '../emails/order-emails'
import { 
	createChargeOnStripe,
	checkOrder,
	createOrder,
	checkResult,	
	formatDate,
	getOrderNumber,
	createResult,
	returnProductItemStock,
	takeProductItemStock,
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
		console.log('Xfers charge called');
		
		let userId = this.userId;
		values['userID'] = userId;
		values['status'] = 'pending';

		// let { address, address2, unit_number, country, postal } = values;
		// let addressDetails = `${address} ${address2} ${unit_number} ${country} ${postal}`;
		const orderNum = getOrderNumber();
		let { priceInCents, email, phone, currency, addonArray } = values;
		let { race_name } = raceData;
		let { first_name, last_name } = userData.profile;
		let desc = `Order for ${race_name} - order Id: ${orderNum}`;
		const IndoPrice = priceInCents / 100;		
		
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
					if(addonArray.length > 0) {
						// add on stuff
						let addonText = '';
						// [{'item', 'variable', 'price'}, {...}]
						// convert addonArray to 'item - variable: price'				
						_.each(addonArray, (c) => {
							let { variable, item, price } = c;
							let priceToShow = price;

							let showCurrency = '$';
							if(currency == 'myr') {
								showCurrency = 'RM';
								priceToShow = price * toMyr;
							}
												
							let variableText = '';
							if (variable) 
								variableText = ` - ${variable}`;
							let text = `${item} ${variableText}: ${showCurrency}${priceToShow.toFixed(2)}\n`;
							addonText = addonText + text;

							// minus avaiable stock for productitem, increase sold stock
							takeProductItemStock(c, race_name);							

						})				
						
						// add addonArray and addonText to values
						values['addonArray'] = addonArray;
						values['addOn'] = addonText;
					}; 

					let checkout_url = result.data.checkout_url;

					// take stock for VR category
					takeStock(raceData, values);
					
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

// Listen to incoming HTTP requests (can only be used on the server).
// confirm order payment - Url xfers will send confirmation to after user made payment
WebApp.connectHandlers.use('/api/order/confirm', (req, res, next) => {	
	console.log('xfers req: ', req.body);
	if (req.body)	{
		let obj = req.body;
		let { txn_id, order_id, status } = obj;
		
		console.log(`Xfers: status for ${order_id}: ${status}`);
		// change order status to cancelled if payment is cancelled or expired
		if( (status == 'cancelled') || (status == 'expired') ) {
			let cancelledOrder = Orders.findOne({orderNum: parseInt(order_id)});
			if(cancelledOrder) {
				// set status to cancelled;
				Orders.update({
					_id: cancelledOrder._id
				}, {
					$set: {
						status: 'cancelled'
					}
				});

				// add stock back
				returnStockByOrderNum(order_id);
	
			}
		}
		if(status == 'paid') {
			// verify notification, send POST to xfers			
			try {
				let url = `${xfersUrl}/charges/${txn_id}/validate`;

				console.log('checking url: ', url);
				const result = HTTP.call("POST", url, {
					headers: { 
						"X-XFERS-USER-API-KEY": xfersUserApi,
						ContentType: "application/json"
					},
					params: obj
				});
				if(result) {										
					// change order to paid
					// set status to paid;
					let paidOrder = Orders.findOne({orderNum: parseInt(order_id)});
					Orders.update({
						_id: paidOrder._id
					}, {
						$set: {
							status: 'paid'
						}
					});
					// create result
					createResultWithOrder(paidOrder);

					// send email to admin and user
					sendEmailWithOrderId(order_id);
				};		

				console.log('Xfers: payment successful');
	    } catch(e) {
	    	console.log('Error in xfers status paid: ', e);	    	
	    }
		}
  }
	
	// return status 200 
	res.setHeader('Content-Type', 'application/json');
  res.writeHead(200);
  res.end();

});

// curl "http://localhost:3000/api/order/confirm" \
//   -H "Content-Type: application/json" \
//   -d '{ "txn_id": "9557a25ad90848e7b02ee5ccfbf1bc8c", "order_id": "21256", "total_amount": "99000", "currency":"IDR", "status":"paid"}'

// curl -X POST http://localhost:3000/api/order/confirm -d "title=Witty Title" -d "author=Jack Rose"

// curl "http://localhost:3000/api/order/confirm" \
//   -H "Content-Type: application/json" \
//   -d '{ "txn_id": "310fd5d40a9846aca80f7469dc6db466", "order_id": "21255", "total_amount": "99000", "currency":"IDR", "status":"cancelled"}'
