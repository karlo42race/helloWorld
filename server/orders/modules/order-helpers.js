import { check } from 'meteor/check';
import { AllResults, Countries, Orders, OrderNumber, ProductItems, Teams, VirtualRaces } from '/imports/api/collections.js';

// stripe
const Stripe = require("stripe")("sk_live_TEPWTflfLxs5O8RzQXjqhnRx");

const createChargeOnStripe = (options) => {
	return new Promise((resolve, reject) => {
		Stripe.charges.create(options, (error, response) => {
			if (error) {
				reject(error);
			} else {
				resolve(response);
			}
		});
	});
};	

// check product addon can be delivered to shipping destination
const checkAddonCountry = ( addonArray, values, race_name ) => {
	let { country } = values;
	_.each(addonArray, (c) => {
		let { item } = c;
		let oneProduct = ProductItems.findOne({ race: race_name, item_name: item });
		let { countryToShip } = oneProduct;
		let index = countryToShip.indexOf(country);
		
		if(index > -1) {
			// item can be shipped
		} else {
			console.warn(`Error: Order ${item} cannot be shipped to ${country}`);
			throw new Meteor.Error('cannot-ship', `${item} cannot be shipped to ${country}`);
		}		
	});

}

// check order if user already registered				
const checkOrder = ( userID, raceData ) => {
	let { _id, race_name } = raceData;
	let orderExists = Orders.findOne({ userID: userID, raceID: _id, status: {$ne: 'cancelled'} });
	if (orderExists) {
		console.log('Error: User', userID, 'already registered for', race_name);
		throw new Meteor.Error('already-registered', `Registration failed. ${orderExists.user_name} have already registered for this run`)
	};
};

// check if total price is correct
const checkPrice = ( values, race_name ) => {	
	let { country, addonArray, price, priceInCents } = values;
	let subTotal = 0;
	let total;
	
	// check priceInCents and price tally
	if(parseInt(Math.round(price*100)) !== priceInCents) {
		console.log(`${price*100}, ${typeof(price*100)}, ${priceInCents}, ${typeof(priceInCents)}`)
		console.warn(`Error: price: ${price} !== priceInCents: ${priceInCents}`);
		throw new Meteor.Error('price-unequal', 'Error: Price in cents not correct');
	};
		
	_.each(addonArray, (c) => {
		let { item } = c;
		let oneProduct = ProductItems.findOne({ race: race_name, item_name: item });		
		subTotal += oneProduct.price; // in SGD
	});
	
	let getCountriesOptions = Countries.find({}).fetch();
	let oneCountry = getCountriesOptions.find(x => x.country === country);
	let { convertFromOneSGD, currency, deliveryFee, racePriceInCurrency } = oneCountry;

	// add country delivery cost
	total = subTotal*convertFromOneSGD + racePriceInCurrency + deliveryFee;

	// fix to 2 decimal	
	let priceFix = parseInt(price*100)/100;
	let totalFix = parseInt(total*100)/100;

	if(priceFix !== totalFix) {
		console.warn(`Error: price ${price} !== total ${totalFix}, typeOf price: ${typeof(price)}, typeOf total: ${typeof(totalFix)}`);
		throw new Meteor.Error('price-error', 'Error: Total price is incorrect');
	};

};

// create order
const createOrder = (raceData, values, currentUser, orderNum, checkout_url) => {
	let { race_name, _id } = raceData;
	let { 
		userID, email, phone, country_code, address, address2, unit_number, country, postal,
		price, currency, medal_engraving, addonArray, addOn, category, 
		team, runner, addressBelongsTo, status
	} = values;
	let { profile, publicID } = currentUser;	
	let { name } = profile;

	let priceFix = 0;
		
	if(price > 0)
		priceFix = parseFloat(Math.round(price * 100) / 100).toFixed(2);	
	
	Orders.insert({
		orderNum,
		product_name: race_name, 
		race: race_name, 
		raceID: _id, 
		userID,
		user_publicID: publicID, 
		user_name: name,
		email, 
		address, 
		address2, 
		unit_number, 
		country, 
		postal,
		phone,
		country_code,
		price: priceFix,
		category,
		desc: '',
		medal_engraving,
		team: team || '', // for teams
		currency,
		addressBelongsTo: addressBelongsTo || name, // for partner runs
		runnerNum: runner || 1, 										// for partner runs
		addonArray,
		addOn: addOn || '',
		createdAt: new Date(),
		status,
		checkout_url
	});				
	console.log('Orders: Inserting order for', race_name, 'by', name, 'complete');	
};

// format date to Do MMM YYY, h:mm a
const formatDate = (date) => {
	return moment(date).format('Do MMM YYYY, h:mm a');
};

// get addonText
const getAddonText = (addonArray, country, race_name) => {
	let addonText = '';
	let countryOption = Countries.findOne({country: country});
	let { racePriceInCurrency, showCurrency } = countryOption;	

	_.each(addonArray, (c) => {
		let { variable, item, price } = c;
		let priceToShow = price * racePriceInCurrency;
							
		let variableText = '';
		if (variable) 
			variableText = ` - ${variable}`;
		let text = `${item} ${variableText}: ${showCurrency}${priceToShow.toFixed(2)}\n`;
		addonText = addonText + text;		
	});

	return addonText;
};

// order number 
const getOrderNumber = () => {
	let orderNumberObj = OrderNumber.find({}).fetch()[0];
	let { _id, orderNumber } = orderNumberObj;  		
	// update order num
  let newOrderNum = parseInt(orderNumber) + 1;
	OrderNumber.update({
		_id: _id
	}, {
		$set: {
			orderNumber: newOrderNum
		}
	})	
	return orderNumber;
};

// create result
const createResult = (raceData, values, currentUser) => {
	let { _id, race_name, race_type } = raceData;
	let { category, email, team, userID } = values;
	let { profile, publicID } = currentUser,
			gender = profile.gender,
			user_name = profile.name;
	
	let resultExists = AllResults.findOne({userID: userID, raceID: _id});
	if (resultExists) {
		console.log('Error: in createResult, user', user_name, userID, 'already has result for', race_name);
	} else {									
		AllResults.insert({
			raceID: _id,
			race: race_name,
			race_type,
			submissions: [],
			userID, 	
			user_name,
			user_email: email, 
			target: 0,
			timing: 0,
			distance: 0,
			position: 0,
			category,
			bib_number: publicID,
			timing_per_km: 0,
			team: team || '',
			gender,
			createdAt: new Date()	
		});
		console.log('AllResults: creating new allResults: ', user_name, 'complete');	

		if(team && (team !== '')) 
			addTeamCount(_id, team);	
	};
};

// add team count
const addTeamCount = (raceID, team) => {	
	// check team exists
	let oneTeam = Teams.findOne({raceID: raceID, team: team});
	if(!oneTeam) {
		console.log(`Error: ${team} not found`);
	} else {
		let { order_count, _id } = oneTeam;		
		let newCount = order_count + 1;
		Teams.update({_id: _id}, {
			$set: {order_count: newCount}
		})

		console.log('AllResults: team updated');
	};
}

// get cost of delivery
const getDeliveryCost = (country) => {
	let checkDeliveryCountryObj = selectCountry.find(x => x.country === country);
	if(checkDeliveryCountryObj) {
		return checkDeliveryCountryObj.deliveryFee;
	} else {
		return 0;
	}
}

// minus category stock if order succeed
const takeStock = (raceData, values) => {
	let { _id } = raceData;
	let { category } = values;

	let oneVirtualRace = VirtualRaces.findOne({_id: _id});		
	let selectedCategory = oneVirtualRace.category.find((c) => { return c.category == category});		
	let { qty, qty_sold, qty_in_stock, name } = selectedCategory;
	let new_qty_sold = parseInt(qty_sold) + 1;
	let new_qty_in_stock = parseInt(qty) - new_qty_sold;

  VirtualRaces.update(
	{_id: _id, 'category.category': category}, {
		$set: {
			'category.$': {
				category,
				name,
				qty,
				qty_sold: new_qty_sold,
				qty_in_stock: new_qty_in_stock
			}	
		}
	}, false, true);
	console.log('VirtualRaces: updated category stock', name);
}

// add back category stock if order cancelled
const returnStockByOrderNum = (orderNum) => {
	let oneOrder = Orders.findOne({orderNum: parseInt(orderNum)});
	// check order exists
	if(!oneOrder)
		return console.log(`Error: Order ${orderNum} not found`);

	let { raceID, category } = oneOrder;	
	let oneVirtualRace = VirtualRaces.findOne({_id: raceID});

	// check if race exists
	if(!oneVirtualRace)
		return console.log(`Error: Race ${oneOrder.race} not found`);

	let selectedCategory = oneVirtualRace.category.find((c) => { return c.category == category});	
	
	// check if category exists
	if(!selectedCategory)
		return console.log(`Error: Category ${category} for race ${oneOrder.race} not found`);	

	let { qty, qty_sold, qty_in_stock, name } = selectedCategory;
	let new_qty_sold = parseInt(qty_sold) - 1;
	let new_qty_in_stock = parseInt(qty) - new_qty_sold;

  VirtualRaces.update(
	{_id: raceID, 'category.category': category}, {
		$set: {
			'category.$': {
				category,
				name,
				qty,
				qty_sold: new_qty_sold,
				qty_in_stock: new_qty_in_stock
			}	
		}
	}, false, true);
	console.log('VirtualRaces: updated category stock', name);
}

// emails
const sendEmailToAdmin = ( emailHTML, currentUser, values, raceData, orderTimestamp, orderNum ) => {
	let { race_name } = raceData;
	// to user
	Email.send({
	  to: 'sales@42race.com',
	  from: "42Race <contact@42race.com>",
	  subject: `[42Race] New runner joins ${race_name}`,
	  html: emailHTML(currentUser, values, raceData, orderTimestamp, orderNum),
	});
	console.log('Orders: Email sent to admin');
};

const sendEmailToUser = ( emailHTML, currentUser, values, raceData, orderTimestamp, orderNum ) => {	
	let { email } = values;
	let { race_name } = raceData;
	// to admin
	Email.send({
	  to: email,
	  from: "42Race <contact@42race.com>",
	  subject: `[42Race] You have joined ${race_name}`,
	  html: emailHTML(currentUser, values, raceData, orderTimestamp, orderNum),
	});
	console.log('Orders: Email sent to user', currentUser.profile.name);
};

// check result if user already registered				
const checkResult = ( userID, raceData ) => {
	let resultExists = AllResults.findOne({userID: userID, raceID: raceData._id});
	if (resultExists) {
		console.log('Error: User', userID, 'already has result for', raceData.race_name);
		throw new Meteor.Error('already-registered', 'Registration failed. You have already registered')
	};
}

// create PA buddy order
const createPAOrder = (raceData, values, currentUser, orderNum, checkout_url) => {	
	let { race_name, _id } = raceData;
	let { 
		phone, address, address2, unit_number, country, postal,
		price, currency, medal_engraving, addonArray, addOn, category, 
		team, runner, addressBelongsTo, status
	} = values;
	let { profile, publicID, emails } = currentUser;	
	let { name } = profile;
	
	// for pa order
	let collection = values.collection;
	let userID = currentUser._id;
	let { user_race, partner_race, user_shoe, partner_shoe } = values;

	let priceFix = 0;

	let email = '';
	if(emails) {
		if(emails[0])
			email = emails[0].address
	}
		
	if(price > 0)
		priceFix = parseFloat(Math.round(price * 100) / 100).toFixed(2);	
	
	Orders.insert({
		orderNum,
		product_name: race_name, 
		race: race_name, 
		raceID: _id, 
		userID,
		user_publicID: publicID, 
		user_name: name,
		email, 
		address: collection, 
		address2, 
		unit_number, 
		country, 
		postal,
		phone,
		price: priceFix,
		category,
		desc: '',
		medal_engraving,
		team: team || '', // for teams
		currency,
		addressBelongsTo: addressBelongsTo || name, // for partner runs
		runnerNum: runner || 1, 										// for partner runs
		addonArray,
		addOn: addOn || '',
		createdAt: new Date(),
		status,
		checkout_url,
		user_race,
		partner_race,
		user_shoe,
		partner_shoe
	});				
	console.log('Orders: Inserting order for', race_name, 'by', name, 'complete');	
}

// minus category stock if order succeed
const takeProductItemStock = (addon, race_name) => {
	let { variable, item, price } = addon;
	// minus avaiable stock for productitem, increase sold stock
	let product = ProductItems.findOne({item_name: item, race: race_name});
			variableArray = product.variable;
			// find index of the variable
			variableIndex = variableArray.map((e) => { return e.variable_name; }).indexOf(variable);
			productID = product._id;							
						
	ProductItems.update({
		_id: productID, 'variable.variable_name': variable
	}, {
		$inc: {
			'variable.$.qty_in_stock': -1,
			'variable.$.qty_sold': 1,
		}
	});
	console.log(`Stock take: ${item} - ${variable}`);
};

// minus addon array stock if order succeed
const takeProductItemStockByArray = (addonArray, race_name) => {
	_.each(addonArray, (c) => {
		takeProductItemStock(c, race_name);
	})	
};

// when order is cancelled, add stock available and reduce stock sold
const returnProductItemStock = (addon, race_name) => {
	let { variable, item, price } = addon;
	// minus avaiable stock for productitem, increase sold stock
	let product = ProductItems.findOne({item_name: item, race: race_name});						
	let productID = product._id;							
						
	ProductItems.update({
		_id: productID, 'variable.variable_name': variable
	}, {
		$inc: {
			'variable.$.qty_in_stock': 1,
			'variable.$.qty_sold': -1,
		}
	});
	console.log(`Stock return: ${item} - ${variable}`);	
}

export { 
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
	returnProductItemStock,
	takeProductItemStock,
	takeProductItemStockByArray,
	takeStock,
	returnStockByOrderNum,
	sendEmailToAdmin,
	sendEmailToUser,
	createPAOrder,
};
