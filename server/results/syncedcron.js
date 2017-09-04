import { VirtualRaces, AllResults, Teams } from '/imports/api/collections.js';

const setEliteRanking = (result) => {
	let { distance, _id, timing_per_km, race, category, elite_position } = result;	

	// check if result is above 7"00 - if yes remove elite_position
	if (timing_per_km < 420 && timing_per_km > 0) {
		let index = AllResults.find({ 
			race: race, 
			category: category, 
			checkResult: {$ne: true},
			timing_per_km : { $lt : 420 }, 
			distance : { $gt : distance } 
		}).count();

		AllResults.update(
			{_id: _id},
				{ $set: {
	      	elite_position: parseInt(index) + 1
	    	} 
	    },
		)	
	
	} else {		
		AllResults.update(
			{_id: _id},
				{ $set: {
	      	elite_position: null
	    	} 
	    },
		)	
	}
}

// Set ranking for race at 5 mins interval
SyncedCron.add({
  name: 'SyncedCron: AllResults set ranking',
  schedule: function(parser) {
    // parser is a later.parse object
    return parser.text('every 1 mins');
  },
  job: function() {      	
		let activeRaces = VirtualRaces.find({}).fetch();
		
		_.each(activeRaces, (oneRace) => {
			let { start_date, end_date, category, race_name, race_type } = oneRace;
			let startDate = moment(start_date).toDate();
			let endDate = moment(end_date).add(1, 'days').toDate();
			let today = new Date;
			let raceName = '';
			let categoryArr = [];
													
			if ((today.getTime() <= endDate.getTime() && today.getTime() >= startDate.getTime())) {
				raceName = race_name;				
				console.log('running sync for ', raceName, 'Start date: ', startDate, 'End date: ', endDate);
				_.each(category, (c) => {
					categoryArr.push(c.category);
				})				
			}
			
			let checkResult = { checkResult: {$not: {$eq: true} } };
			if (categoryArr.length > 0) {
				_.each(categoryArr, (c) => {
	  			var results = AllResults.find({ race: raceName, category: c }).fetch();	

	  			// check if race is a virtual race
	  			if (race_type == 'virtual_race') {
	  				// update position for these results based on speed
						_.each(results, (r) => {			
							let { timing_per_km, _id, category, distance, checkResult } = r;
							let index;
							if (checkResult) {
								index = AllResults.find({ race: raceName }).count() - 1;
							} else {
								if (timing_per_km == 0) {
									index = AllResults.find({ 
										race: raceName, 
										category: c, 
										checkResult: {$ne: true},
										timing_per_km : { $gt: 0 } 
									}).count();			
								} else {
									// for buddy run, have not complete category e.g. 5/10km done
									if (distance < category) {
										index = AllResults.find({ 
											race: raceName, 
											category: c,
											checkResult: {$ne: true},
											timing_per_km : { $gt: 0 } 
										}).count();	
									} else { // both buddies have completed the run									
										index = AllResults.find({ 
											race: raceName, 
											category: c, 
											distance: { $gte: parseInt(category)}, 
											checkResult: {$ne: true},
											timing_per_km : { $lt: timing_per_km, $gt: 0 } 
										}).count();	
									}; // end of distance < category else									
								}; // end of timing_per_km == 0 else
							}; // end of checkResult else
							
							AllResults.update(
								{_id: _id},
									{ $set: {
					        	position: parseInt(index) + 1
					      	} 
					      },
							)
							
						});
						console.log('AllResults: set ranking for race', raceName, 'category', c, 'by speed done');
	  				
	  			}

	  			// if race is a challenge
					if (race_type == 'challenge') {
	  				// update position for these results based on distance
						_.each(results, (r) => {
							let { distance, checkResult, _id } = r;
							let index;
							if(checkResult) {
								index = AllResults.find({ race: raceName }).count() - 1;
							} else {
								index = AllResults.find({ 
									race: raceName, 
									category: c, 
									checkResult: {$ne: true},
									distance: { $gt : distance } 
								}).count();
							};
							
							AllResults.update(
								{_id: _id},
									{ $set: {
					        	position: parseInt(index) + 1
					      	} 
					      },
							)							

							setEliteRanking(r);
						});
						console.log('AllResults: set ranking for race', raceName, 'category', c, 'by distance done');						

	  			}
				}) 	
			};

			// update team ranking
			if(raceName && raceName !== '') {
				let raceTeams = Teams.find({raceID: oneRace._id}).fetch();
				if(raceTeams && raceTeams[0]) {
					// update dist
					_.each(raceTeams, (t) => {						
						let { position, total_distance, total_timing, team, order_count } = t;
						let dist_to_count = 0, timing_to_count = 0;

						let resultsToCount = AllResults.find({raceID: oneRace._id, team: team}).fetch();
						_.each(resultsToCount, (r) => {
							let { distance, timing } = r;
							dist_to_count += distance;
							timing_to_count += timing;
						});

						let timing_per_km_to_count = parseInt(timing_to_count/dist_to_count);
						let average_distance = 0;
						if(dist_to_count !== 0 && timing_to_count !== 0) 
							average_distance = parseInt(dist_to_count/order_count);
						
						let distanceFix = Math.round(dist_to_count * 100) / 100;
						let avgFix = Math.round(average_distance * 100) / 100;
						Teams.update({_id: t._id}, {
							$set: { 
								total_distance: distanceFix,
								total_timing: timing_to_count,
								average_distance: avgFix,
								timing_per_km: timing_per_km_to_count || 0,								
							}
						});

					});					

					// update ranking by variable rank_by - change rank_by to change ranking 		
					let updatedRaceTeams = Teams.find({raceID: oneRace._id}).fetch();
					_.each(updatedRaceTeams, (t) => {
						let index = updatedRaceTeams.length - 1;
						let { average_distance, total_distance, team } = t;
						
						if(total_distance > 0) {
							index = Teams.find({raceID: oneRace._id, total_distance: {$gt: total_distance } }).count();		
						};

						Teams.update({_id: t._id}, {
							$set: { 								
								position: parseInt(index) + 1
							}
						});						

					})					

					console.log('AllResults: team rank tally complete for ', race_name);				
				};				
			};
			

		});
	}	
});		


// 		let race = '21Day Challenge Jan 2017';
// 		let category = ['20', '50', '100', '200'];

// 		// for each of the race category;
// 	  for (var i = 0; i < category.length; i++) {
// 	  	console.log('AllResults: set ranking for category', category[i], '..');  	
// 	  	var results = AllResults.find({ race: race, category: category[i] }).fetch();	

// 			// update position for these results
// 			_.each(results, function(c) {
// 				var distance = c.distance;
// 				var resultID = c._id;
// 				var index = AllResults.find({ race: race, category: category[i], distance : { $gt : distance } }).count();							
// 				AllResults.update(
// 					{_id: resultID},
// 						{ $set: {
// 		        	position: parseInt(index) + 1
// 		      	} 
// 		      },
// 				)
// 			});
// 			console.log('AllResults: set ranking for race', race, 'category', category[i], 'done');
// 	  }
//   }


// Set ranking for us race at 5 mins interval by distance
// SyncedCron.add({
//   name: 'SyncedCron: AllResults set ranking for Stars and Stripes Challenge 2016 categories',
//   schedule: function(parser) {
//     // parser is a later.parse object
//     return parser.text('every 15 mins');
//   },
//   job: function() {    
// 		let race = 'Stars and Stripes Challenge 2016';
// 		let category = ['21', '42'];

// 		// for each of the race category;
// 	  for (var i = 0; i < category.length; i++) {
// 	  	console.log('AllResults: set ranking for category', category[i], '..');  	
// 	  	var results = AllResults.find({ race: race, category: category[i] }).fetch();	

// 			// update position for these results
// 			_.each(results, function(c) {
// 				var distance = c.distance;
// 				var resultID = c._id;
// 				var index = AllResults.find({ race: race, category: category[i], distance : { $gt : distance } }).count();							
// 				AllResults.update(
// 					{_id: resultID},
// 						{ $set: {
// 		        	position: parseInt(index) + 1
// 		      	} 
// 		      },
// 				)
// 			});
// 			console.log('AllResults: set ranking for race', race, 'category', category[i], 'done');
// 	  }
//   }
// });


// Set ranking for unicorn race at 5 mins interval by speed
// SyncedCron.add({
//   name: 'SyncedCron: AllResults set ranking for new year run categories',
//   schedule: function(parser) {
//     // parser is a later.parse object
//     return parser.text('every 5 mins');
//   },
//   job: function() {    
// 		let race = 'New Year Resolution 2017';
// 		let category = ['5', '10', '21', '42'];
		
// 		// for each of the race category;
// 		for(var i=0; i<category.length; i++) {
// 			console.log('AllResults: set ranking for category', category[i], '..');  	
// 			// find results with distance >= shorterDistance and <= longerDistance
// 			var results = AllResults.find({ race: race, category: category[i] }).fetch();	

// 			// update position for these results
// 			_.each(results, function(c) {			
// 				var timing_per_km = c.timing_per_km;
// 				var resultID = c._id;				
// 				var index;
// 				if (timing_per_km == 0) {
// 					index = AllResults.find({ race: c.race, category: c.category, timing_per_km : { $gt: 0 } }).count();			
// 				} else {
// 					index = AllResults.find({ race: c.race, category: c.category, timing_per_km : { $lt: timing_per_km, $gt: 0 } }).count();
// 				}
// 				AllResults.update(
// 					{_id: resultID},
// 						{ $set: {
// 		        	position: parseInt(index) + 1
// 		      	} 
// 		      },
// 				)
// 			});
// 			console.log('AllResults: set ranking for race', race, 'category', category[i], 'done');
		
// 		}
// 	}
// });


// start syncedcron
SyncedCron.start();
