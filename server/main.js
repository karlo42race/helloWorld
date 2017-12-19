import { check, Match } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { UserNumber } from '/imports/api/collections';

// deactivated user account:
// 1. cannot login
// 2. cannot be searched in user feeds
// 3. user feeds cannot be found
// 4. public profile cannot be accessed

Meteor.startup(() => {    
  // change reset password url
  Accounts.urls.resetPassword = function(token) {    
    return Meteor.absoluteUrl(`reset-password/${token}`, {rootUrl: "https://web.42race.com"});
  };  
  Accounts.emailTemplates.siteName = '42Race';  
  Accounts.emailTemplates.resetPassword.from = () => {
  // Overrides the value set in `Accounts.emailTemplates.from` when resetting
  // passwords.
  return '42Race Password Reset <no-reply@42race.com>';
};
  //Mail gun config
  process.env.MAIL_URL = "smtp://postmaster%4042race.com:0efd98885c6ba88ffc9664c09961bb46@smtp.mailgun.org:587";
  switch (process.env.NODE_ENV) {
    case "development":
        //keys for development environment
        console.log("development keys loaded");
        process.env.XFERS_USER_API = "21Yk2GcY-z8eD_857t5g7mXbvgfaYc4xKdsxx1cGhXM";
        process.env.XFERS_URL = "https://sandbox-id.xfers.com/api/v3";
        process.env.RETURN_URL = "https://client-42race-staging.herokuapp.com/order/complete";
        process.env.NOTIFY_URL = "https://client-42race-staging.herokuapp.com/api/order/confirm";
        process.env.CANCEL_URL = "https://client-42race-staging.herokuapp.com/test/order/cancel";
        break;
    case "staging":
        // keys for staging environment
        console.log("staging keys loaded");
        process.env.XFERS_USER_API = "21Yk2GcY-z8eD_857t5g7mXbvgfaYc4xKdsxx1cGhXM";
        process.env.XFERS_URL = "https://sandbox-id.xfers.com/api/v3";
        process.env.RETURN_URL = "https://client-42race-staging.herokuapp.com/order/complete";
        process.env.NOTIFY_URL = "https://client-42race-staging.herokuapp.com/api/order/confirm";
        process.env.CANCEL_URL = "https://client-42race-staging.herokuapp.com/test/order/cancel";
        break;
    case "production":
        // keys for production
        console.log("production keys loaded");
        process.env.XFERS_USER_API = "yGfmVQrAr1y9c_aytbZw4ZW4rfUxugMDJzdyRQTxXtc";
        process.env.XFERS_URL = "https://id.xfers.com/api/v3";
        process.env.RETURN_URL = "https://web.42race.com/order/complete";
        process.env.NOTIFY_URL = "https://web.42race.com/api/order/confirm";
        process.env.CANCEL_URL = "https://web.42race.com/test/order/cancel";
        break;
    default:
        // default will take production keys
        console.log("production keys loaded");
        process.env.XFERS_USER_API = "yGfmVQrAr1y9c_aytbZw4ZW4rfUxugMDJzdyRQTxXtc";
        process.env.XFERS_URL = "https://id.xfers.com/api/v3";
        process.env.RETURN_URL = "https://web.42race.com/order/complete";
        process.env.NOTIFY_URL = "https://web.42race.com/api/order/confirm";
        process.env.CANCEL_URL = "https://web.42race.com/test/order/cancel";
  }


  // Set prerender.io for SEO
  var prerenderio = Npm.require('prerender-node').set('prerenderToken', 'aTFsETL9dxpS9Fe0Y5r8');

  // testing prerender.io on local
  // var prerenderio = Npm.require('prerender-node').set('prerenderServiceUrl', 'http://localhost:3000/').set('prerenderToken', 'aTFsETL9dxpS9Fe0Y5r8');  

  // check if user account is active before login
  Accounts.validateLoginAttempt((attempt) => {
    if(attempt.user && Roles.userIsInRole(attempt.user._id, ['deactivate'])) {
      attempt.allowed = false;
      throw new Meteor.Error('user-deactivated', 'This account is deactivated');
    } else {
      return true;
    }
  });

});


// set up login via facebook
ServiceConfiguration.configurations.remove({
    service: 'facebook'
});

// for production app
ServiceConfiguration.configurations.insert({
    service: 'facebook',
    appId: '811042285683456',
    secret: '62540373bcd57b27868b1d396d3c4a22'
});

// development testing
// ServiceConfiguration.configurations.insert({
//     service: 'facebook',
//     appId: '1064400027014346',
//     secret: '3fe3ddbf65548d50fa879dab5d0bd10e'
// });
