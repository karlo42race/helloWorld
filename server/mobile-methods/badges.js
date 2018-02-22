/**
 * Created by sheeraz on 18/1/18.
 */

 import {VirtualRaces, AllResults} from '/imports/api/collections.js';

 Meteor.methods({
    'badges.getBadges'(badgeType, isUserBadges = false){
        let condition = {};
        if (badgeType != 'all') {
            condition = {race_type: badgeType}
        }

        let races = VirtualRaces.find(condition,  {sort: {end_date: 1} });
        let racesFetched = races.fetch();
        let racesArr = [];
        let getVertualRace = [];
        let badgesData = {};
        let raceCategoryMapping = {};
        _.each(racesFetched, (race) => {
            racesArr.push(race.race_name);
            getVertualRace[race.race_name] = race;
        });
        let allResults = AllResults.find({ $and: [{ race: {$in: racesArr}, userID: this.userId }] }).fetch();
        let completedResults = {
            "raceName": [],
            "allResults": [],
            "virtualRaces": []
        };

        let joinedResults = [];
        _.each(allResults, (result) => {
            let oneRace = getVertualRace[result.race];
            if (!isNaN(result.distance) && !isNaN(result.category) && parseInt(result.distance) >= parseInt(result.category)){
                completedResults.raceName.push(result.race);
                raceCategoryMapping[result.race] = result.category;
            } else {
                joinedResults.push(result.race)
            }

            completedResults.allResults.push(result);
            completedResults.virtualRaces.push(oneRace);
        });
        _.each(racesFetched, (race) => {
            let race_data = {'name': race.race_name, 'type': race.race_type};

            if (completedResults.raceName.indexOf(race.race_name) > -1 ){
                race_data['img'] = race.badge_color;
                race_data['subText'] = raceCategoryMapping[race.race_name]+ "KM Finisher";
                race_data['distance'] = raceCategoryMapping[race.race_name];
                race_data['completed'] = true;
                race_data['virtualRaces'] = race;
                race_data['allResults'] = completedResults.allResults[completedResults.raceName.indexOf(race.race_name)];
                race_data['status'] = 'completed';

            }else{
                race_data['completed'] = false;
                race_data['img'] = race.badge_grey;
                race_data['virtualRaces'] = race;

                if(joinedResults.indexOf(race.race_name)> -1 ){
                    race_data['subText'] = "Joined";
                    race_data['status'] = 'joined';
                    race_data['allResults'] = completedResults.allResults[completedResults.raceName.indexOf(race.race_name)];
                } else {
                    if(race.end_date>new Date()){
                        race_data['status'] = 'open';
                        race_data['subText'] = "Open";
                    } else {
                        race_data['status'] = 'notOpen';
                    }
                }
            }

            //TODO Remove blank img check
            if (typeof race.end_date=="object" && race_data["img"]!="" && race_data["img"]!=null){

                if (isUserBadges) {
                    if(badgesData[(race_data['status'])] !== undefined){
                        badgesData[race_data['status']].push(race_data);
                    } else {
                        badgesData[race_data['status']] = [race_data];
                    }

                } else {
                    if(badgesData[(race.end_date.getFullYear()).toString()] !== undefined){
                        badgesData[(race.end_date.getFullYear()).toString()].push(race_data);
                    }else{
                        badgesData[(race.end_date.getFullYear()).toString()] = [race_data];
                    }
                }
            }
        });


        let completeCurrentRace = {};

        _.each(badgesData.completed, (data) => {
            completeCurrentRace = data;
            if (moment(data.virtualRaces.end_date) > moment(new Date()) ) {
                completeCurrentRace.status = "current race"
                if (badgesData.currentComplete !== undefined) {
                    badgesData["currentComplete"].push(completeCurrentRace);
                } else {
                    badgesData["currentComplete"] = [completeCurrentRace];
                }
            } else {
                completeCurrentRace.status = "past race"
                if (badgesData.pastComplete !== undefined) {
                    badgesData["pastComplete"].push(completeCurrentRace);
                } else {
                    badgesData["pastComplete"] = [completeCurrentRace];
                }
            }
        })


        if (badgesData.completed) {
            badgesData.completed.sort(function(a,b){
                return new Date(b.virtualRaces.end_date) - new Date(a.virtualRaces.end_date);
            });
        }

        if (badgesData.joined) {
            badgesData.joined.sort(function(a,b){
                return new Date(b.virtualRaces.end_date) - new Date(a.virtualRaces.end_date);
            });
        }

        if (badgesData.open) {
            badgesData.open.sort(function(a,b){
                return new Date(b.virtualRaces.end_date) - new Date(a.virtualRaces.end_date);
            });
        }

        if (badgesData.currentComplete) {
            badgesData.currentComplete.sort(function(a,b){
                return new Date(b.virtualRaces.end_date) - new Date(a.virtualRaces.end_date);
            });
        }

        if (badgesData.pastComplete) {
            badgesData.pastComplete.sort(function(a,b){
                return new Date(b.virtualRaces.end_date) - new Date(a.virtualRaces.end_date);
            });
        }

        if (badgesData.notOpen) {
            badgesData.notOpen.sort(function(a,b){
                return new Date(b.virtualRaces.end_date) - new Date(a.virtualRaces.end_date);
            });
        }


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