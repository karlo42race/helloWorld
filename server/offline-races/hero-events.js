import { check, Match } from 'meteor/check';
import { HeroEvents, HeroEventsApplications } from '/imports/api/collections.js';

// publish the hero events data based on name
Meteor.publish('getHeroEvents', function(limit) {  
  var options = {
    limit: limit,    
    sort: {'promo_start_date': -1},
  };

  Counts.publish(this, 'getTotalCount', HeroEvents.find({}), {nonReactive: true});
  return HeroEvents.find({}, options);
});

// publish one hero event based on slug
Meteor.publish('oneHeroEvent', function(slug) {
  let event = HeroEvents.findOne({slug: slug});

  return [
    HeroEvents.find({slug: slug}),
    HeroEventsApplications.find({ $and: [{userID: this.userId}, {eventID: event._id}] })
  ]
});

Meteor.methods({  
  // Add application to hero events 
  'heroEventsApplications.insert'(values, userData, eventDetails, photoArray) {
    let { name, gender, category, phone, email, ranMarathon, runningTimesPerWeek, distancePerWeek, inspiration, photos } = values;
    let { _id, publicID } = userData;
    let { race_name, applicants } = eventDetails;
    let eventID = eventDetails._id;
    
    console.log('va', values);
    console.log('ph', photos);
    console.log('ph arr', photoArray);
        
    console.log('HeroEventsApplication:', name, 'applying for', race_name, '..');
    if(photos.length < 1) 
      throw new Meteor.Error('no-photos', 'No photos');

    HeroEventsApplications.insert({
      userID: _id, 
      user_publicID: publicID, 
      name, 
      gender, 
      category, 
      phone, 
      email, 
      ranMarathon, 
      runningTimesPerWeek, 
      distancePerWeek, 
      inspiration, 
      photos, 
      eventID, 
      race_name,
      createdAt: new Date()
    })
    
    console.log('HeroEvents: updating applicants number for ', race_name, '..');          
    
    let addApplicants = parseInt(applicants) + 1;

    HeroEvents.update({
      race_name: race_name
    }, {
      $set: {
        applicants: addApplicants
      }
    })
    console.log('HeroEvents: updating applicants number for ', race_name, 'from', applicants, 'to',addApplicants, 'complete');    
  },
  
  // upload hero application confirmation
  'heroEventsApplications.uploadConfirmation'(url, id) {
    HeroEventsApplications.update({
      _id: id
    }, {
      $set: {
        confirmationLetter: url
      }
    });    
    console.log('HeroEventsApplications: ', this.userId, 'submit confirmation letter: '); 
  },

});
