import { AllResults, Comments, Submissions } from '/imports/api/collections.js';
import { addressUpdateBy } from './modules/user-helpers';

Meteor.methods({	
	// user change user password
	'users.changePassword'(password) {
		console.log('Users: user change password: ', this.userId);
		Accounts.setPassword(this.userId, password, {logout: false});
	},	

	// update profile pic
	'users.updateProfilePic'(url) {		
		console.log(`Logging: users.updateProfilePic, url: ${url}`);

		Meteor.users.update({
			_id: this.userId
		}, {
			$set: {
				profilePic: url
			}
		})
		console.log('Users: udating user profile picture for: ', this.userId, 'complete'); 
	},

	// update user profile
	'users.updateDetails'(value) {
		let { motto, name, first_name, last_name, phone, country_code, nric, gender, birthday } = value;
		
		console.log(`Updating user profile for ${name}`);		
		
		if(!name || !first_name || !last_name || !phone )
			throw new Meteor.Error('field-missing', 'Error: Please fill in all the fields');
		if(phone && phone.length<4)
			throw new Meteor.Error('phone-error', 'Error: Fill in correct phone number');
		if(!country_code && country_code.length > 4)
			throw new Meteor.Error('phone-error', 'Error: Fill in correct country code');

		Meteor.users.update({
			_id: this.userId
		}, {
			$set: {
				phone,	
				country_code,
				birthday: new Date(birthday),				
				profile: {
					name,
					first_name,
					last_name,
					nric: '',
					gender,
				},
				motto,
				updatedBy: name,
				updatedOn: new Date()
			}
		})		
		// update display name for user's results, comments and submissions
		let results = AllResults.find({userID: this.userId}).fetch(),
				submissions = Submissions.find({userID: this.userId}).fetch(),
				comments = Comments.find({userID: this.userId}).fetch();

		_.each(results, (c) => {			
			let { _id } = c;
			// check if username is in array
			if ( Array.isArray(c.user_name) ) {
				console.log("AllResults: result's username is in array for", name);
			} else {
				AllResults.update({
					_id: _id
				}, { 
					$set: { 
						user_name: name,
						gender						
					} 
				});
			};
		});
		_.each(submissions, (c) => {			
			let { _id } = c;
			Submissions.update({_id: _id}, { $set: { user_name: name } })							
		});
		_.each(comments, (c) => {			
			let { _id } = c;
			Comments.update({_id: _id}, { $set: { user_name: name } })							
		});
				
		console.log('Users: updating user details for: ', name, 'complete');  
	},

	// update user address
	'users.updateAddress'(value) {		
		console.log(`Logging: users.updateAddress, value: ${value}`);
		let { address, address2, unit_number, country, postal } = value;
		if(!address || !country)
			throw new Meteor.Error('missing-value', 'Please fill in address and country');

		let currentUser = Meteor.users.findOne({_id: this.userId});		
		
		// update addressUpdate by and time;
		addressUpdateBy(value, this.userId);

		Meteor.users.update({
			_id: this.userId
		}, {
			$set: {				
				address: {
					address,
					address2,
					unit_number,
					country,
					postal,					
				}
			}
		})

		console.log('Users: udating user address for: ', currentUser.publicID, 'complete');  
	},

	// update details and address from order
	'users.updateFromOrder'(data, currentUser) {
		let { 
			phone, birthday, first_name, last_name, nric, gender, country_code,
			address, address2, unit_number, country, postal, email
		} = data;
		let { profile } = currentUser;
		let { name } = profile;

		console.log(`Updating user profile for ${name}`);		
		
		if(!name || !first_name || !last_name || !phone || !country )
			throw new Meteor.Error('field-missing', 'Error: Please fill in all the fields');

		// update addressUpdate by and time;
		addressUpdateBy(data, this.userId);

		Meteor.users.update({
			_id: this.userId
		}, {
			$set: {
				phone,
				country_code,
				birthday: new Date(birthday),				
				profile: {
					name,
					first_name,
					last_name,
					nric,
					gender
				},
				address: {
					address,
					address2,
					unit_number,
					country,
					postal,					
				},
				updatedBy: name,
				updatedOn: new Date()
			}
		});
		console.log('Users: updating user details and address for: ', email, 'complete');
	},

	// update details only from order - for orderFreeForm
	'users.updateDetailsFromOrder'(data, currentUser) {
		let { 
			phone, birthday, first_name, last_name, nric, gender, email, country_code
		} = data;
		let { profile } = currentUser;
		let { name } = profile;
		
		console.log(`Logging: users.updateDetailsFromOrder, data: ${data}\n user: ${currentUser}`);

		if(!name || !first_name || !last_name || !phone ) {
			console.log(data, currentUser);
			console.log(name, first_name, last_name, phone);
			throw new Meteor.Error('field-missing', 'Error: Please fill in all the fields');
		}
		if(phone && phone.length<6)
			throw new Meteor.Error('phone-error', 'Error: Fill in correct phone number');
		if(!country_code && country_code.length > 4)
			throw new Meteor.Error('phone-error', 'Error: Fill in correct country code');

		Meteor.users.update({
			_id: this.userId
		}, {
			$set: {
				phone,
				country_code,
				birthday: new Date(birthday),				
				profile: {
					name,
					first_name,
					last_name,
					nric: '',
					gender
				},				
				updatedBy: name,
				updatedOn: new Date()
			}
		});
		console.log('Users: updating user details only for: ', email, 'complete');
	},

	'users.readMessage'() {		
		Meteor.users.update({
			_id: this.userId
		}, {
			$set: {
				message: false				
			}
		})
	},

	// user adding email on their dashboard	
	'users.addEmail'(email) {		
		console.log('Users: user adding email', email);
		Accounts.addEmail(this.userId, email);
	},
	
	// get user by email
  'users.getUserByEmail'(email) {
  	console.log(`Logging: users.updateProfilePic, email: ${email}`);
  	console.log('Users: getting user by email ', email);  
  	return Accounts.findUserByEmail(email);  	  	
  }, 

  // email reset Password token
	'users.emailResetPassword'(id) {
    console.log('Users: email reset password to user: ', id);
    Accounts.sendResetPasswordEmail(id);
  },  
})
