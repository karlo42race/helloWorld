import { check, Match } from 'meteor/check';
import { Payments } from '/imports/api/collections.js';
import { PaymentEmailToUser, PaymentEmailToAdmin } from '../emails/payment-emails.js';

Meteor.methods({
	// payment using stripe 
	'payments.chargeCard'(stripeToken, options) {		
    check(stripeToken.id, String);

    console.log('Payments: charging card for', options.name, 'for amount', options.currency, options.amount); 
		var Stripe = require("stripe")("sk_live_TEPWTflfLxs5O8RzQXjqhnRx");
	 	
	 	// ensure amount is 2 decimal
		let price = parseFloat(Math.round(options.amount * 100) / 100).toFixed(2);
	 	let priceInCents = price * 100; 

	 	const createChargeOnStripe = (stripeOptions) => {
   		return new Promise((resolve, reject) => {
				Stripe.charges.create(stripeOptions, (error, response) => {
					if (error) {
						reject(error);
					} else {
						resolve(response);
					}
				});
   		});
		};

		return createChargeOnStripe({
      source: stripeToken.id,
      amount: priceInCents, // TO NOTE, charge is in cents
      currency: options.currency,
      description: 'Charge for ' + options.name + ' - 42Race',
      receipt_email: options.email
    })
		.then((charge) => {
			console.log('Stripes: success charge is', charge.outcome);  		
		 		  	    
			Payments.insert({
				name: options.name,				
				company: options.company, 
				phone: options.phone, 
				email: options.email, 
				invoice_num: options.invoice_num, 
				currency: options.currency, 
				amount: options.amount, 
				notes: options.notes, 
				createdAt: new Date()				
			})
			console.log('Payments: created new payment for', options.name, 'sending email..');		
			
			Meteor.defer(() => {
				let timeStamp = new Date();
				// to user
				Email.send({
				  to: options.email,
				  from: "42Race <contact@42race.com>",
				  subject: "[42Race] Payment made to 42Race",
				  html: PaymentEmailToUser(options, timeStamp),
				});
								
				// to admin
				Email.send({
				  to: 'contact@42race.com',
				  from: "42Race <contact@42race.com>",
				  subject: "[42Race] Payment made by " + options.name,
				  html: PaymentEmailToAdmin(options, timeStamp),
				});
				console.log('Payments: email sent to admin and', options.email);
			});

			return charge;
		})
		.catch((error) => {
			throw new Meteor.Error('charge-denied', `${error}`);
		});

  },

  'business.submitForm'(values) {
  	let { name, email, phone, company, race_dates, number_of_runners } = values;
  	Meteor.defer(() => {
  		Email.send({
			  to: email,
			  from: "42Race <contact@42race.com>",
			  subject: `[42Race] Virtual race for ${company}`,
			  html: `
			  	<p>Hi ${name},</p>
			  	<p>Thank you for your interest in having a virtual race for your company. We will get in touch with you soon. </p>
			  	<p>
			  		Company: ${company} <br />
			  		Phone: ${phone} <br />
			  		Race dates: ${race_dates} <br />
			  		Number of runners: ${number_of_runners} <br />
			  	</p>
			  	<p>
			  		Best Regards, <br />
			  		Joy, 42Race
			  	</p>
			   `,
			});

			Email.send({
			  to: "contact@42race.com",
			  from: "42Race <contact@42race.com>",
			  subject: `[42Race Business] ${name} is enquiring on virtual race for ${company}`,
			  html: `
			  	<p>${name} submitted the contact form on 42Race business page.</p>
			  	<p>Details:</p>
			  	<p>
			  		Name: ${name} <br />
			  		Company: ${company} <br />
			  		Email: ${email} <br />
			  		Phone: ${phone} <br />
			  		Race dates: ${race_dates} <br />
			  		Number of runners: ${number_of_runners} <br />
			  	</p>
			  	<p>
			  		Best Regards, <br />
			  		Joy, 42Race
			  	</p>
			   `,
			});
  	});
		
  },

});
