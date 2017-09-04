import admin from "firebase-admin";

var serviceAccount = require("/server/firebase/firebaseServiceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fresh-park-106001.firebaseio.com/"
});

Meteor.methods({
	'firebase.getNotification'(token) {
		console.log('got ', token);
		var payload = {
		  data: {
		    score: "850",
		    time: "2:45"
		  }
		};
		let options = ''
		admin.messaging().sendToDevice(token, payload)
		.then((response) => {
	    // See the MessagingDevicesResponse reference documentation for
	    // the contents of response.
	    console.log("Successfully sent message:", response);
	  })
	  .catch((error) => {
	    console.log("Error sending message:", error);
	  });
	},

});
