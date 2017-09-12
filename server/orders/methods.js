import { check } from 'meteor/check';
import { Orders, OrderNumber, ProductItems, AllResults, VirtualRaces } from '/imports/api/collections.js';
import { OrderEmailToAdmin, OrderEmailToUser, OrderFreeEmailToAdmin, OrderFreeEmailToUser, OrderEmailToBuddy, OrderEmailToUserWithBuddy } from '../emails/order-emails'
import { 
	createChargeOnStripe,
	checkAddonCountry,
	checkOrder,
	checkResult,
	createOrder,
	formatDate,
	getOrderNumber,
	createResult,
	takeProductItemStock,
	takeStock,
	sendEmailToAdmin,
	sendEmailToUser,
	createPAOrder } from './modules/order-helpers';

const toMyr = 3.2;

Meteor.methods({	 // payment using stripe 
	'orders.create'(raceData, currentUser, values, token) {		
		let { race_name } = raceData;
		let { email, priceInCents, currency, addonArray } = values;
		let { profile } = currentUser;
		let userId = this.userId;
		console.log('Orders: charging card for race: ', race_name, 'for user: ', email);			

		// check email exists
		if(!email || (email == ''))
			throw new Meteor.Error('no-email', 'Error: no email, add email on your dashboard');

		check(token.id, String); // check stripeToken is string
		checkOrder( userId, raceData );	// check if user has register for race
		checkAddonCountry(addonArray, values, race_name); // check if addon can be delivered to shipping country

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
			// check if there is addon
			if(addonArray && addonArray.length > 0) {
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

					takeProductItemStock(c, race_name);

				})				
				
				// add addonArray and addonText to values
				values['addonArray'] = addonArray;
				values['addOn'] = addonText;
			} 
			
			values['userID'] = userId;
			// create order
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
	
	// create free orders
	'orders.createFree'(raceData, currentUser, values) {
		let { race_name } = raceData;
		let { email, priceInCents } = values;
		let { profile } = currentUser;
		let userId = this.userId;
		console.log('Orders: charging card for race: ', race_name, 'for user: ', email);
		
		checkOrder( userId, raceData );	// check if user has register for race

		let orderTimestamp = formatDate(new Date());		
    let orderNum = getOrderNumber(); // get order number 
    
		console.log('Orders: Inserting order for', race_name, 'by', profile.name); 		
		
		// add status of payment to paid
		values['status'] = 'paid';
		let checkout_url = null;			
		
		values['userID'] = userId;
		// create order
		createOrder(raceData, values, currentUser, orderNum, checkout_url);			

		Meteor.defer(() => {		

			takeStock(raceData, values); // minus stock for race category;
			// 4. RESULTS - create
			createResult(raceData, values, currentUser);
			// 5. SEND EMAIL				
			sendEmailToAdmin(OrderFreeEmailToAdmin, currentUser, values, raceData, orderTimestamp, orderNum); // send email to admin				
			sendEmailToUser(OrderFreeEmailToUser, currentUser, values, raceData, orderTimestamp, orderNum); // send email to user
		});						
		
	},

	'orders.chargeCardWithBuddy'(raceData, currentUser, values, token) {
  	let userId = this.userId;
  	let partnerData = values.partner;  			
		let partner = Meteor.users.findOne({_id: partnerData._id});
		let checkout_url = null;

		let { race_name } = raceData;
		let { email, priceInCents, currency, addonArray } = values;
		let { profile } = currentUser;

    console.log('Orders: charging card for race: ', race_name, 'for user: ', email);

		// 1. CHECKS
		check(token.id, String); // check stripeToken is string
		checkOrder( userId, raceData );	// check if user has register for race
		checkOrder( partnerData._id, raceData );	// check if partner has register for race

		let orderTimestamp = formatDate(new Date());		
    let orderNum = getOrderNumber(); // get order number 
		
    // check partnerData exist 
    if (partnerData == '') {
    	console.log('Error: Partner not selected for order', userData.email);
    	throw new Meteor.Error('no-partner', 'Payment failed. Please select a partner');
    };

    // check user has email
    if (!currentUser.emails) {
    	console.log('Error: User does not have email', currentUser._id);
    	throw new Meteor.Error('no-email-user', 'Payment failed. Please add your email in your dashboard');
    };
    // check partnerData got email
    if (!partner.emails) {
    	console.log('Error: Partner does not have email', partner._id);
    	throw new Meteor.Error('no-email-partner', 'Payment failed. Partner does not have email address');
    };
		
		values['userID'] = userId;
		// let addressBelongsToInput = addressBelongsTo || profile.name;
		
		// charge with stripe
		return createChargeOnStripe({
      source: token.id,
      amount: priceInCents, // this is equivalent to $9.90
      currency: currency,
      description: `Charge for ${race_name} order no: #${orderNum} - 42Race`,
      receipt_email: email
    })
		.then((charge) => {
			console.log('Stripes: success charge is', charge.outcome, orderNum);  				 		  		    	
				
			// 3. create order
			// create order for user
			let { collection1, collection2 } = values;
			values.runner = 1;
			// collection point for user
			values.collection = collection1;

			createPAOrder(raceData, values, currentUser, orderNum, checkout_url);
			// createOrder(orderNum, raceData, addressData, userData, orderData, userID, addressBelongsToInput, 1);			
			takeStock(raceData, values); // minus stock for race category;
			
			// create order for partner
			partnerData['email'] = partner.emails[0].address;
			partnerData['phone'] = partner.phone;			
			partnerData['user_name'] = partner.profile.name;		
			partnerData['user_publicID'] = partner.publicID;
			
			// collection point for partner
			values.collection = collection2;
			createPAOrder(raceData, values, partner, orderNum, checkout_url);
			takeStock(raceData, values); // minus stock for race category;
					
			console.log('Orders: two orders inserted');

			Meteor.defer(() => {
				// check if result exist
				checkResult( userId, raceData );
				checkResult( partnerData._id, raceData );
				
				// Create result				
				AllResults.insert({
					raceID: raceData._id, 
					race: raceData.race_name,
					race_type: raceData.race_type, 
					submissions: [],
					userID: [userId, partnerData._id],
					user_name: [profile.name, partnerData.profile.name],
					user_email: [email, partnerData.email],
					target: 0,
					timing: 0,
					distance: 0,
					position: 0,
					category: values.category, 
					bib_number: [currentUser.publicID, partnerData.publicID],
					timing_per_km: 0,
					team: values.team,
					gender: '',
					createdAt: new Date()
				});
				console.log('AllResults: creating new allResults: ', profile.name, partnerData.profile.name, 'complete');

				// SEND EMAIL								
				sendEmailToAdmin(OrderFreeEmailToAdmin, currentUser, values, raceData, orderTimestamp, orderNum); // send email to admin								
								
				// to user for buddy run
				Email.send({
				  to: email,
				  from: "42Race <contact@42race.com>",
				  subject: "[42Race] You have accepted " + raceData.race_name,
				  html: OrderEmailToUserWithBuddy(currentUser, values, raceData, orderTimestamp, orderNum, partnerData),
				});
				// to partner
				Email.send({
				  to: partnerData.email,
				  from: "42Race <contact@42race.com>",
				  subject: "[42Race] You have accepted " + raceData.race_name,
				  html: OrderEmailToBuddy(currentUser, values, raceData, orderTimestamp, orderNum, partner),
				});
			});

			return charge;
		})
		.catch((error) => {
			throw new Meteor.Error('charge-denied', `${error}`);
		});
		
  },


})
