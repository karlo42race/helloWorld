import { check, Match } from 'meteor/check';
import { Races, Reviews } from '/imports/api/collections.js';

// for single race reviews
Meteor.publish('getReviews', function(slug, limit) {     
  var options = {
    limit: limit,    
    sort: {'createdAt': -1},
  };

  var reviews = Reviews.find({ race_slug: slug });
  var reviews_userIDs = reviews.map(function(review) {
  	return review.userID;
  })  

	// Count total count by notifications
	Counts.publish(this, 'reviewsCount', Reviews.find({userID: this.userId}), {nonReactive: true});
	return [
		Meteor.users.find({_id: {$in: reviews_userIDs}}, {fields: {'profile.name': 1, 'profilePic': 1} }),
		reviews,
	]
});

Meteor.methods({
  'reviews.insert'(raceData, values) {
    let userID = this.userId,
        user = Meteor.users.findOne({_id: userID}),
        user_name = user.profile.name,
        user_publicID = user.publicID;
    console.log('Reviews: adding review by ', userID, '..');
    
    let { _id, race_name, slug } = raceData;
    let { year, review, scores, total, category } = values;
    let { route, waterStation, expo, entitlement, overall } = scores;
    let raceID = _id;

    Reviews.insert({
      raceID: _id,
      race_name,
      race_slug: slug,
      year,
      category,
      userID,
      user_name,
      user_publicID,
      review,
      route_score: parseInt(route),
      water_station_score: parseInt(waterStation),
      expo_score: parseInt(expo),
      entitlement_score: parseInt(entitlement),
      overall_exp_score: parseInt(overall),
      total_score: total,
      createdAt: new Date()
    }, function(err, res) {
      if (err) {
        console.log('Reviews: err encountered: ', err);
        throw new Meteor.Error('err-review', 'There was an error in submission');
      } else {
        console.log('Reviews: reviewID is: ', res);
        console.log('Reviews: updating race: ', raceID, '..');

        let race = Races.findOne({_id: raceID});
            old = {
              reviews_quantity: 0,
              route_score: 0,
              water_station_score: 0,
              expo_score: 0,
              entitlement_score: 0,
              overall_exp_score: 0,
              total_score: 0
            }         

        if(race.reviews) {
          old = {
              reviews_quantity: race.reviews_quantity || 0,
              route_score: race.route_score || 0,
              water_station_score: race.water_station_score || 0,
              expo_score: race.expo_score || 0,
              entitlement_score: race.entitlement_score || 0,
              overall_exp_score: race.overall_exp_score || 0,
              total_score: race.total_score || 0
            }       
        }
        // add new review to Race
        Races.update(
        {_id: raceID}, {
          $push: {
            reviews: res
          }
        });
                
        let new_reviews_quantity = old.reviews_quantity + 1;
            new_score = {             
              route_score: ((old.route_score)*(old.reviews_quantity) + parseInt(route))/new_reviews_quantity,
              water_station_score: ((old.water_station_score)*(old.reviews_quantity) + parseInt(waterStation))/new_reviews_quantity,
              expo_score: ((old.expo_score)*(old.reviews_quantity) + parseInt(expo))/new_reviews_quantity,
              entitlement_score: ((old.entitlement_score)*(old.reviews_quantity) + parseInt(entitlement))/new_reviews_quantity,
              overall_exp_score: ((old.overall_exp_score)*(old.reviews_quantity) + parseInt(overall))/new_reviews_quantity,
              total_score: ((old.total_score)*(old.reviews_quantity) + parseInt(total))/new_reviews_quantity
            }
        
        // function to convert ensure 1 dec point for scores;
        function n(n) { return parseInt(n*10)/10 };
        // update race        
        Races.update(
        {_id: raceID}, {
          $set: {           
            reviews_quantity: new_reviews_quantity,
            route_score: n(new_score.route_score),
            water_station_score: n(new_score.water_station_score),
            expo_score: n(new_score.expo_score),
            entitlement_score: n(new_score.entitlement_score),
            overall_exp_score: n(new_score.overall_exp_score),
            total_score: n(new_score.total_score),
          }
        });
        console.log('Reviews: updating race: ', raceID, 'complete');
      }
    });

    console.log('Reviews: adding review by ', userID, 'complete');
  },

});
