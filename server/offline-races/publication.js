import { check, Match } from 'meteor/check';
import { Races } from '/imports/api/collections.js';

// for User Race List
Meteor.publish('getOfflineRaces', function(searchText, limit, skipCount, showAll, country) {
  let positiveIntegerCheck = Match.Where(function(x) {
    check(x, Match.Integer);
    return x >= 0;
  });
  check(skipCount, positiveIntegerCheck);

  let options = {
    limit: limit,
    skip: skipCount,
    sort: [['race_date', 'ascending']],
  };
  
  if (country == 'all') 
   country = {$exists: true};      

  let todayDate = new Date(),
      filter = new RegExp(searchText, 'i'),
      fields = [{race_name: filter, country: country, race_date: {$gte: todayDate} }];
  
  if (showAll || (searchText !== '') )
    fields = [{race_name: filter, country: country}];  
  
  Counts.publish(this, 'getAllRaces', Races.find({}), {nonReactive: true});
  Counts.publish(this, 'getRacesCount', Races.find({ $and: fields }), {nonReactive: true});
  return Races.find({ $and: fields }, options);
});

// single race 
Meteor.publish('oneOfflineRace', function(slug) {          
  return Races.find({ slug: slug });
});
