import braintree from 'braintree';

var paypalAccessToken = 'access_token$sandbox$pgydz3mt9jzv5tsg$a7fc3341e837675a39617cf3f1ebc448';

const generateToken = () => {
	var gateway = braintree.connect({
		environment: braintree.Environment.Sandbox,
	  accessToken: paypalAccessToken
	});

	return new Promise((resolve, reject) => {
		gateway.clientToken.generate({}, function (err, res) {
			if (err) {
				reject(err);
			} else {
				resolve(res);
			}
  	});
		
	});
};

Meteor.methods({
	'paypal.getToken'() {
		console.log('getting paypal token');

		return generateToken();
	},

});
