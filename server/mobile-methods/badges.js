/**
 * Created by sheeraz on 18/1/18.
 */

import {VirtualRaces, AllResults} from '/imports/api/collections.js';

Meteor.methods({
    'badges.getBadges'(badgeType){
        let condition = {};
        if (badgeType != 'all')
            condition = {race_type: badgeType}
        let races = VirtualRaces.find(condition,  {sort: {end_date: 1} });
        let racesFetched = races.fetch();
        let racesArr = [];
        let badgesData = {};
        let raceCategoryMapping = {};
        _.each(racesFetched, (race) => {
            racesArr.push(race.race_name);
        });
        let allResults = AllResults.find({ $and: [{ race: {$in: racesArr}, userID: this.userId }] }).fetch();
        let completedResults = [], joinedResults = [];
        _.each(allResults, (result) => {
            if (!isNaN(result.distance) && !isNaN(result.category) && parseInt(result.distance) >= parseInt(result.category)){
                completedResults.push(result.race);
                raceCategoryMapping[result.race] = result.category;
            }
            else
                joinedResults.push(result.race)
        });
        _.each(racesFetched, (race) => {
            let race_data = {'name': race.race_name, 'type': race.race_type};

            if (completedResults.indexOf(race.race_name)> -1 ){
                race_data['img'] = race.badge_color;
                race_data['subText'] = raceCategoryMapping[race.race_name]+ "KM Finisher";
                race_data['completed'] = true;
            }else{
                race_data['completed'] = false;
                race_data['img'] = race.badge_grey;
                if(joinedResults.indexOf(race.race_name)> -1 ){
                    race_data['subText'] = "Joined";
                }else{
                    if(race.end_date>new Date())
                        race_data['subText'] = "Open";
                }
            }
            //TODO Remove blank img check
            if (typeof race.end_date=="object" && race_data["img"]!="" && race_data["img"]!=null){
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
                badgeData["name"] = virtualRace.race_name;
                badgeData["distance"] = allResults.distance;
                badgeData["pace"] = allResults.timing_per_km;
                badgeData["category"] = allResults.category;
                badgeData["position"] = allResults.position;
                badgeData["type"] = "completed";
                badgeData["start_date"] = virtualRace.start_date;
                badgeData["end_date"] = virtualRace.end_date;
                let allUserResults = AllResults.findOne({race: race_name});
                _.each(allUserResults, (results)=> {
                    if (!isNaN(results.distance) && !isNaN(results.category) && parseInt(results.distance) >= parseInt(results.category)) {
                        totalCount += 1;
                    }
                });
                badgeData["totalBadge"] = totalCount;
            }
            else{

                badgeData["img"] = virtualRace.badge_grey;
                totalCount = AllResults.find({race: race_name}).count();
                badgeData["name"] = virtualRace.race_name;
                badgeData["runners"] = totalCount;
                badgeData["start_date"] = virtualRace.start_date;
                badgeData["end_date"] = virtualRace.end_date;
                badgeData["type"] = "incomplete";

            }
        }else{
            badgeData["img"] = virtualRace.badge_grey;
            totalCount = AllResults.find({race: race_name}).count();
            badgeData["name"] = virtualRace.race_name;
            badgeData["runners"] = totalCount;
            badgeData["start_date"] = virtualRace.start_date;
            badgeData["end_date"] = virtualRace.end_date;
            badgeData["type"] = "join";
        }
        return badgeData;
    }
});