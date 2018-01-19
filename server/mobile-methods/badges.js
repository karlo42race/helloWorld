/**
 * Created by sheeraz on 18/1/18.
 */

import {VirtualRaces, AllResults} from '/imports/api/collections.js';

Meteor.methods({
    'badges.getBadges'(badgeType){
        let races = VirtualRaces.find({race_type: badgeType},  {sort: {end_date: -1} });
        let racesFetched = races.fetch();
        let racesArr = [];
        let badgesData = {};
        _.each(racesFetched, (race) => {
            racesArr.push(race.race_name);

        });
        let allResults = AllResults.find({ $and: [{ race: {$in: racesArr}, userID: this.userId }] }).fetch();
        let results = [];
        _.each(allResults, (result) => {
            if (!isNaN(result.distance) && !isNaN(result.category) && parseInt(result.distance) >= parseInt(results.category))
                results.push(result.race_name);
        });

        _.each(racesFetched, (race) => {
            let race_data = {'name': race.race_name};
            if (results.indexOf(race.race_name)> -1){
                race_data['img'] = race.badge_color;
            }else{
                race_data['img'] = race.badge_grey;
            }
            if (typeof race.end_date=="object"){
                if(badgesData[(race.end_date.getFullYear()).toString()] !== undefined){
                    badgesData[(race.end_date.getFullYear()).toString()].push(race_data);
                }else{
                    badgesData[(race.end_date.getFullYear()).toString()] = [race_data];
                }
            }
        });
        return badgesData;
    },
    'badges.getDetails'(race_name){
        let badgeData = {};
        let virtualRace = VirtualRaces.findOne({race_name: race_name});
        let totalCount = 0;

        let allResults = AllResults.findOne({race: race_name, userID: this.userId});

        if (allResults){
            // If completed
            if (!isNaN(allResults.distance) && !isNaN(allResults.category) && parseInt(allResults.distance) >= parseInt(allResults.category)){
                badgeData["img"] = virtualRace.badge_color;
                badgeData["distance"] = allResults.distance;
                badgeData["pace"] = allResults.timing_per_km;
                badgeData["category"] = allResults.category;
                badgeData["position"] = allResults.position;
                let allUserResults = AllResults.findOne({race: race_name});
                _.each(allUserResults, (results)=> {
                    if (!isNaN(results.distance) && !isNaN(results.category) && parseInt(results.distance) >= parseInt(results.category)) {
                        totalCount += 1;
                    }
                });
                badgeData["totalBadge"] = totalCount;
            }
            // TODO Can be merged if design is same for both joined race and race which user has not joined
            // If Not yet completed
            else{

                badgeData["img"] = virtualRace.badge_grey;
                totalCount = AllResults.find({race: race_name}).count();
                badgeData["runners"] = totalCount;
                badgeData["start_date"] = virtualRace.start_date;
                badgeData["end_date"] = virtualRace.end_date;

            }
        }else{
            badgeData["img"] = virtualRace.badge_grey;
            totalCount = AllResults.find({race: race_name}).count();
            badgeData["runners"] = totalCount;
            badgeData["start_date"] = virtualRace.start_date;
            badgeData["end_date"] = virtualRace.end_date;
        }
        return badgeData;
    }
});