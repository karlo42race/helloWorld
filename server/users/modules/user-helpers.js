import { check } from 'meteor/check';

const addressUpdateMethod = (userId) => {
	let currentUser = Meteor.users.findOne({_id: userId});	
	console.log('User: update address');	
	Meteor.users.update({
		_id: userId
	}, {
		$set: {				
			addressUpdate: {			
				updatedBy: currentUser.profile.name || currentUser.publicID,
				updatedOn: new Date()
			}
		}
	});
};

const addressUpdateBy = (value, userId) => {
	// check if address is different
	let { address, address2, unit_number, country, postal } = value;
	let currentUser = Meteor.users.findOne({_id: userId});		
	if(currentUser.address) {
		let c = currentUser.address;

		if( (c.address !== address) || 
			(c.address2 !== address2) || 
			(c.unit_number !== unit_number) || 
			(c.country !== country) || 
			(c.postal !== postal) ) {
			// user address is different, update address
			addressUpdateMethod(userId);	
		}; 

	} else {
		// no user address before, update address
		addressUpdateMethod(userId);
	}
};

export { addressUpdateBy };
