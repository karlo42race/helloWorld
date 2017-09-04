import { check, Match } from 'meteor/check';
import { Blogs } from '/imports/api/collections.js';

Meteor.publish('publicBlogs', function(searchText, limit, skipCount, tag) {
  var positiveIntegerCheck = Match.Where(function(x) {
    check(x, Match.Integer);
    return x >= 0;
  });
  check(skipCount, positiveIntegerCheck);
  
  var filter = new RegExp(searchText, 'i');
  var options = {
    limit: limit,
    skip: skipCount,
    sort: {'createdAt': -1},
  };

  Counts.publish(this, 'dataCount', Blogs.find({$or: [ { title: filter }, { tag: tag } ]}), {nonReactive: true});  
  return Blogs.find({$or: [ { title: filter }, { tag: filter } ]}, options);
});

Meteor.publish('getOneBlogPublic', function(slug) {  
  return Blogs.find({slug: slug});
});
