import { check, Match } from 'meteor/check';

Meteor.methods({
	'app.getVersion'() {
		// todo: get this data from database - kim to be allowed to updaate
		let data = {
			ios: {
		    version: "1.0.6",
				forceUpdate: true
			},
			android: {
		    version: "1.0",
				forceUpdate: false
	    }		 	
		};

		return data;
	},

});
