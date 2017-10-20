import { check, Match } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { UserMeta, UserNumber } from '/imports/api/collections.js';
import { MailChimp } from '../emails/mailchimp.js';
import CryptoJS from 'crypto-js';

// user's own data - dashboard
Meteor.publish('userData', function() {
  return Meteor.users.find({ _id: this.userId }, {fields: {} });
});

// user's own meta - dashboard
Meteor.publish('ownUserMeta', function() {
  return UserMeta.find({ userID: this.userId }, {fields: {} });
});

Meteor.publish('publicUserData', function(publicID) {		
	let fields = {
		'profile.name': 1, 
		'profilePic': 1, 
		'motto': 1, 
		'publicID': 1,
		'badges': 1,
		'roles': 1
	}
  return Meteor.users.find({publicID: publicID}, { fields: fields } );
});

Meteor.publish('ownerPublicUserData', function() {	
	let fields = {
		'profile.name': 1, 
		'profilePic': 1, 
		'motto': 1, 
		'publicID': 1,
		'message': 1,
		'badges': 1
	}
  return Meteor.users.find({_id: this.userId}, { fields: fields } );
});

// for showing a list of users e.g. users who like a submission
Meteor.publish('listOfUsers', function(arrayId) {		
	let fields = {
		'profile.name': 1, 
		'profilePic': 1, 		
		'publicID': 1		
	}
	
  return Meteor.users.find({_id: {$in: arrayId} }, { fields: fields } );
});

// search function in feeds
Meteor.publish('searchUsers', function(limit, value) {	
  var filter = new RegExp(value, 'i');
  		filterInt = parseInt(value);
  		fields = { $or: [ 
					  			{ 'emails.address': filter }, 
					  			{ 'profile.name': filter }, 
					  			{ 'publicID': filterInt } 
								]}
  var options = {
		limit,		
		sort: {'profile.name': -1},
	};

	Counts.publish(this, 'dataCount', Meteor.users.find(fields), {nonReactive: true});
  return Meteor.users.find(fields, options);
})

// search users in buddy race order form
Meteor.publish('publicSearchUsers', function(searchText, limit, skipCount) {	
	var filter = new RegExp(searchText, 'i');
	let filterBy = { $or: [ 
									{ 'publicID': parseInt(searchText) }, 
					  			{ 'profile.first_name': filter }, 
					  			{ 'profile.last_name': filter }, 
					  			{ 'profile.name': filter }
								]}
	
	if (searchText == '') {
		filterBy = {_id: 1234}
	}
	
	let fields = {
		'profile.name': 1, 
		'profilePic': 1, 		
		'publicID': 1
	}
	var options = {
		limit: limit,		
		skip: skipCount,
		sort: {name: 1},
		fields: fields
	};	

	Counts.publish(this, 'dataCount', Meteor.users.find(filterBy), {nonReactive: true});
  return Meteor.users.find( filterBy, options );
});


// out of Meteor methods
Accounts.onCreateUser(function(options, user) {
  let userNum = UserNumber.find({}).fetch();
  let publicID = userNum[0].userNumber;
  let userNumID = userNum[0]._id;
  newPublicID = parseInt(publicID) + 1;
	
	console.log(`options are ${options}, The user is: ${user}`);
	
	// create userMeta 
	// check if meta data exists for user
	let exists = UserMeta.findOne({user_publicID: publicID});
	if (!exists) {
		// add user Meta
		UserMeta.insert({
			userID: user._id,
			user_publicID: publicID,			
			badges: [],
			total_distance: 0,
			total_timing: 0,
			submissions_count: 0,
			likes_count: 0,
			createdAt: new Date()
		})
	}	
	
	// add in mailchimp
	Meteor.defer(() => {
		let emailAddress = '';
		if (user.services) {
			service = _.keys(user.services)[0] // get service type
	    emailAddress = user.services[service].email; 
			if (!emailAddress) {
				emailAddress = user.emails[0].address;					
			} 
		} 

		let firstName = options.profile.name;
		// console.log('email', emailAddress, 'firstName', firstName);
		// add to mailchimp
		MailChimp.lists('subscribe', {
	    list_id: '54ca8fe45f',
	    status: 'subscribed',
	    subscriber_hash: CryptoJS.MD5(emailAddress),
	    email_address: emailAddress,
	    merge_fields: {
	      FNAME: firstName  
	    },
	  });
	})

  // increment publicID
	UserNumber.update({
		_id: userNumID
	}, {
		$set: {
			userNumber: newPublicID
		}
	})
	console.log('userNum is now: ', newPublicID);

  if (user.services) { // sign up via external service, e.g. facebook
    service = _.keys(user.services)[0] // get service type
    email = user.services[service].email;     

    console.log(`user services are: ${user.services}`);
	  if (email) {	  	
	  	oldUser = Meteor.users.findOne({"emails.address": email});	  	
	  	if (oldUser) { // user with email exists	  		
	  		// console.log('4');
	  		if (oldUser.services.facebook) { // user has facebook service
	  			console.log('Users: user has facebook service');
	  			// console.log('5');
	  		} else { // user does not have facebook service
	  			console.log('Users: user has no such service, adding service', user.services);	  				  			
	  			// console.log('6');
	  			oldUser.services[service] = user.services[service];
	  			newUser = oldUser;
	  			Meteor.users.remove(oldUser._id); // delete user
    			return newUser; // create and login user
	  		}	  		
	  	} else { // create new account, no email registered	  		
	  		// console.log('7');
	  		user.emails = [{address: user.services[service].email, verified: true}];
	  		user.profile = {};
	  		if (user.services[service].name) {
	  			user.profile.name = user.services[service].name; 	
	  			console.log(`user services[service].name is: ${user.services[service].name}`);
	  			console.log(`user services[service].fullname is: ${user.services[service].fullname}`);
	  		};
	  		if (user.services[service].first_name) {
	  			user.profile.first_name = user.services[service].first_name;	
	  		};
	  		if (user.services[service].last_name) {
	  			user.profile.last_name = user.services[service].last_name; 	
	  		};
	  		if (user.services[service].gender) {
	  			user.profile.gender = user.services[service].gender; 	
	  		};
	  		user.publicID = publicID;
	  		console.log('Users: account created');
	  		return user;
	  	}
	  } else { // create new account, sign up via normal password user creation	  	
	  	if (options.profile) {
	  		let name = '';
	  		if(options.profile.name) {
	  			name = options.profile.name;
	  		} else if (options.profile.fullname) {
	  			name = options.profile.fullname;
	  		} else if (options.profile.username) {
	  			name = options.profile.username;
	  		}
    		user.profile = options.profile;
    		user.profile.name = name;
    		user.publicID = publicID;
    		console.log(`options.profile is ${options.profile}`);
    		console.log(`user.profile is ${user.profile}`);
	  	}
	  	console.log('Users: account created');
	  	return user;
	  };
  };  
});
