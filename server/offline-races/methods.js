import { check } from 'meteor/check';
import { Races } from '/imports/api/collections.js';

Meteor.methods({
// add image
  'races.insertImage'(slug, url) {
    let userID = this.userId;
    let race = Races.findOne({slug: slug});
    Races.update({
      slug: slug
    }, {$push: {
        images: url
      }},
    );
  },

});
