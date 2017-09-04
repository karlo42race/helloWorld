import { check } from 'meteor/check';
import { HTTP } from 'meteor/http';

var clientId = "17382";
var client_secret = "fc338a0780a0995da381943aecd8d1f4efdbef2a";
var access_token = "15c0dd550da474dea96c8a5ebb2b0770b26a237e";

Meteor.methods({
	'strava.authenticate'(code) {
		check(code, String);
    this.unblock();
		
		let url = `https://www.strava.com/oauth/token/client_id=${clientId}/client_secret=${client_secret}/code=${code}`;
		
    try {
			const result = HTTP.call("POST", "https://www.strava.com/oauth/token", {
				params: { client_id: clientId, client_secret: client_secret, code: code }
			});
			return result;
    } catch(e) {
    	console.log(e);
    	return false;
    }
				
	}

});
