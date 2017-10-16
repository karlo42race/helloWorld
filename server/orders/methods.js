import { check } from 'meteor/check';
import { AllResults, Countries, Coupons, Orders, OrderNumber, ProductItems, VirtualRaces } from '/imports/api/collections.js';
import { OrderEmailToAdmin, OrderEmailToUser, OrderFreeEmailToAdmin, OrderFreeEmailToUser, OrderEmailToBuddy, OrderEmailToUserWithBuddy } from '../emails/order-emails'
import { 
	createChargeOnStripe,
	checkAddonCountry,
	checkOrder,
	checkPrice,
	checkResult,
	createOrder,
	formatDate,
	getAddonText,
	getOrderNumber,	
	createResult,
	takeCouponStock,
	takeProductItemStock,
	takeProductItemStockByArray,
	takeStock,
	sendEmailToAdmin,
	sendEmailToUser,
	createPAOrder } from './modules/order-helpers';

Meteor.methods({	 // payment using stripe 
	'orders.create'(raceData, currentUser, values, token) {		
		let { race_name } = raceData;
		let { email, priceInCents, currency, addonArray, country } = values;
		let { profile } = currentUser;
		let userId = this.userId;
		console.log('Orders: charging card for race: ', race_name, 'for user: ', email);
				
		// check email exists
		if(!email || (email == ''))
			throw new Meteor.Error('no-email', 'Error: no email, add email on your dashboard');

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
				
				// add addonArray and addonText to values
				values['addonArray'] = addonArray;
				values['addOn'] = addonText;
			}; 
			// end addon check

			// for promoCode
			let coupon_type;
			if(values.promoCode !== '') {
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


  'orders.checkCoupon'(couponCode, country_name, race_name, subtotal, countryCurrency) {
  	check(couponCode, String);
  	check(country_name, String);
  	check(race_name, String);

  	let couponCodeFix = couponCode.toUpperCase().trim();
  	let oneCoupon = Coupons.findOne({coupon_code: couponCodeFix});
  	let text = '', err = '', data = [];
  	
  	if(oneCoupon) {  		
  		let { amount, country, currency, start_date, expiry_date, race, type } = oneCoupon;

  		let getCountriesOptions = Countries.find({}).fetch();
			let oneCountry = getCountriesOptions.find(x => x.country === country_name);
			let { showCurrency } = oneCountry;

  		let today = new Date();
			
			// check if currency is correct 
			if(countryCurrency !== currency) {
				// cannot be used for this race
  			text = ''; err = 'Coupon cannot be used for this country'; data = [];
  			return { text, err, data };
  		}

  		// check if coupon can be used for this race;
  		if(race && race.length > 1 && race.indexOf(race_name) == -1) {
  			// cannot be used for this race
  			text = ''; err = 'Coupon cannot be used for this race'; data = [];
  			return { text, err, data };
  		}; 
			
			// check if coupon can be used for this race;	
  		if(country && country.length > 1 && country.indexOf(country_name) == -1) {
  			// cannot be used for this country
  			text = ''; err = 'Coupon cannot be used for this country'; data = [];
  			return { text, err, data };  			
  		};

			// check if coupon expired
  		if(expiry_date && today.getTime() > expiry_date.getTime()) {
				text = ''; err = 'Coupon expired'; data = [];
				return { text, err, data };
  		};

  		// check if coupon started
  		if(start_date && today.getTime() < start_date.getTime()) {
				text = ''; err = 'Coupon not availale'; data = [];
				return { text, err, data };
  		};

  		// check if still have coupon left;
  		if(oneCoupon.qty_left < 1) {
  			text = ''; err = 'No stock left'; data = [];
  			return { text, err, data };
  		};
			
			// coupon available
			let typeShow = '';
			let newTotal = subtotal;
			let discount = amount;
			if(type && type == 'fix_cart') {				
				text = `${showCurrency} ${amount} OFF`;				
				newTotal = subtotal - amount;
			};

			if(type && type == 'percentage') {
  			text = `${amount}% OFF`;
  			discount = parseInt((subtotal*amount/100)*100)/100;
  			newTotal = subtotal*((100-amount)/100);
  			// fix to 2 decimal	
				newTotal = parseInt(newTotal*100)/100;
			};
			
			// check if price is -ve
			if(newTotal < 0)
				throw new Meteor.Error('price-negative', 'Error: problem with coupon');

  		data = oneCoupon;
  		data.newTotal = newTotal;
  		data.discount = discount;
  		return { text, err, data };
  			
  	} else {
  		// no coupon found
  		text = ''; err = 'No coupon found'; data = [];
  		return { text, err, data };
  	};  	
  	
  },




})
