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
    return Meteor.absoluteUrl('reset-password/' + token);
  };  
  Accounts.emailTemplates.siteName = '42Race';  
  Accounts.emailTemplates.resetPassword.from = () => {
  // Overrides the value set in `Accounts.emailTemplates.from` when resetting
  // passwords.
  return '42Race Password Reset <no-reply@42race.com>';
};
  //Mail gun config
  process.env.MAIL_URL = "smtp://postmaster%4042race.com:0efd98885c6ba88ffc9664c09961bb46@smtp.mailgun.org:587";

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
