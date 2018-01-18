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
    }
});