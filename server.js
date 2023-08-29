var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app = express();

/*
    browserify: browserify server.js -o bundle.js
    url: http://localhost:8081/scrape?choice=NFL&roster=false&logo=false&schedule=false
*/

app.get('/scrape', function (req, res) {
    console.log('Function run ...');

    // https://raw.githubusercontent.com/dallinski/sports-roster-api/master/roster_scraper.py
    ESPN_ROOT = 'http://espn.go.com'
    SPORTS = {
        'NFL': {
            'base_url': 'http://espn.go.com/nfl/teams',
            'roster_links_selector': '.logo-nfl-medium span a[href^="/nfl/team/roster/"]',
            'schedule_links_selector': '.logo-nfl-medium span a[href^="/nfl/team/schedule/"]',
            'team_names_selector': '.logo-nfl-medium h5 a[href^="/nfl/team/_/name/"]',
            'team_logo_selector': 'img.teamlogo',
            'id_capture_regex': '/nfl/team/roster/_/name/(.*)/.*',
            'json_file': 'nfl.json'
        },
        'MLB': {
            'base_url': 'http://espn.go.com/mlb/teams',
            'roster_links_selector': '.logo-mlb-medium span a[href^="/mlb/teams/roster?team="]',
            'team_names_selector': '.logo-mlb-medium h5 a[href^="http://espn.go.com/mlb/team/_/name/"]',
            'team_logo_selector': 'img.teamlogo',
            'id_capture_regex': '/mlb/team/roster/_/name/(.*)/.*',
            'json_file': 'mlb.json'
        },
        'NBA': {
            'base_url': 'http://espn.go.com/nba/teams',
            'roster_links_selector': '.logo-nba-medium span a[href^="/nba/teams/roster?team="]',
            'team_names_selector': '.logo-nba-medium h5 a[href^="http://espn.go.com/nba/team/_/name/"]',
            'team_logo_selector': 'img.teamlogo',
            'id_capture_regex': '/nba/teams/roster\?team=(.*)',
            'json_file': 'nba.json'
        },
        'NCAA_FOOTBALL': {
            'base_url': 'http://espn.go.com/college-football/teams',
            'roster_links_selector': '.medium-logos span a[href^="/ncf/teams/roster?teamId="]',
            'team_names_selector': '.medium-logos h5 a[href^="http://espn.go.com/college-football/team/_/id/"]',
            'id_capture_regex': '/ncf/teams/roster\?teamId=(.*)',
            'json_file': 'ncaa_football.json',
            'schedule_links_selector': ".TeamLinks__Links .TeamLinks__Link a[href^='/college-football/team/schedule/']",
        },
        'NCAA_BASKETBALL': {
            'base_url': 'http://espn.go.com/mens-college-basketball/teams',
            'roster_links_selector': '.medium-logos span a[href^="/ncb/teams/roster?teamId="]',
            'team_names_selector': '.medium-logos h5 a[href^="http://espn.go.com/mens-college-basketball/team/_/id/"]',
            'id_capture_regex': '/ncb/teams/roster\?teamId=(.*)',
            'json_file': 'ncaa_basketball.json'
        },
    }

    var choice = req.query.choice;
    var getLogosFlag = (req.query.logo === 'true' );
    var getRosterFlag = (req.query.roster === 'true' );
    var getScheduleFlag = (req.query.schedule === 'true' );

    console.log('Choice ...' + choice);
    console.log('Logo ...' + getLogosFlag);
    console.log('Roaster ...' + getRosterFlag);
    console.log('Schedule ...' + getScheduleFlag);

    var choiceTools = SPORTS[choice];
    var baseUrl = choiceTools.base_url;
    var all_rosters = {};
    var all_nfl_schedules = {};
    var schedule_counter = 0;
    var counter = 0;

    console.log('baseUrl ...' + baseUrl);

    request(baseUrl, function (error, response, html) {
        console.log('fetched ...');
        if (!error) {
            console.log('no error ...');
            console.log(html.length);
            var $ = cheerio.load(html);
            
            var rosterLinks = $(choiceTools['roster_links_selector']);
            console.log('selecting elements ...');
            var teamNames = $('.TeamLinks a.AnchorLink h2');

            console.log('teams ...' + teamNames.length);

            for (var i = 0; i < rosterLinks.length; i++) {
                var urlElement = rosterLinks[i];
                var team_name = teamNames[i].children[0].data;
                console.log("Scraping: " + team_name);

                getRoster(urlElement, team_name, i, rosterLinks.length);
                // all_rosters[team_name] = {
                //     "name": team_name,
                //     "roster": getRoster(urlElement, i, rosterLinks.length)
                // };
            }

            if (getScheduleFlag) {
                var scheduleLinks = $(choiceTools['schedule_links_selector']);
                console.log("Schedules ... " + scheduleLinks.length);

                for (var i = 0; i < scheduleLinks.length; i++) {
                    var scheduleLinkElement = scheduleLinks[i];
                    var team_name = teamNames[i].children[0].data;

                    getSchedule(scheduleLinkElement, team_name, i, scheduleLinks.length);
                }
            }
            console.log('Finished ...');

        } else {
            console.log('error ...');
        }

        // fs.writeFile(choice + '.json', JSON.stringify(all_rosters, null, 4), function (err) {
        //     console.log('File successfully written! - Check your project directory for the ' + choice + '.json file');
        // })

        // res.send('successfully scraped ' + choice + ' rosters!');

        
    })//END request(base_url)


    function getRoster(urlElement, teamName, index, arrLen) {
        // var roster = {};
        var roster = [];
        var msgOpts = "";

        request(ESPN_ROOT + urlElement.attribs.href, function (error, response, html) {
            if (!error) {
                counter +=1;
                var $ = cheerio.load(html);

                //If setup to download logos
                if (getLogosFlag && choiceTools.team_logo_selector) {
                    // console.log('Downloading: ' + teamName + '\'s Logo ');
                    var logoImgElement = $(choiceTools['team_logo_selector']);
                    msgOpts += 'Logos';

                    downloadLogos(logoImgElement, teamName);
                }
                
                if (getRosterFlag) {
                    
                    var categories = [];
                    if(getLogosFlag) {
                        msgOpts += ' and Rosters';
                    } else {
                        msgOpts += 'Rosters';
                    }
                    $('tr.colhead').filter(function () {
                        var data = $(this);
                        var category_elements = data.find('td');

                        for (var index = 0; index < category_elements.length; index++) {
                            var ele = category_elements[index];
                            var text = $(ele).text();
                            
                            categories.push(text);
                        }
                    });

                    $('tr.oddrow, tr.evenrow').filter(function () {
                        var data = $(this);

                        for (var index = 0; index < data.length; index++) {
                            var player_row = data[index];
                            var player = {};

                            for (var k = 0; k < data.find('td').length; k++) {
                                var td = data.find('td')[k];
                                player[categories[k]] = $(td).text();
                            }
                            // roster[player['NAME']] = player;
                            roster.push(player);
                        }
                    });
                    
                
                    all_rosters[teamName] = {
                        "name": teamName,
                        "roster": roster
                    };
                    // return roster;

                    if (counter >= arrLen) {

                        fs.writeFile(choice + '.json', JSON.stringify(all_rosters, null, 4), function (err) {
                            console.log('File successfully written! - Check your project directory for the ' + choice + '.json file');
                        });

                        res.send('Finished Scraping ' + choice + ' ' + msgOpts + '!');
                    }

                }//END if(getRosterFlag)

            }//END if(!error)


        })//END request

    }//END getRoster(urlElement)

    function getSchedule(linkElement, teamName, index, arrLen) {
        // var roster = {};
        var preseason = [];
        var regularseason = [];
        console.log(teamName);

        request(ESPN_ROOT + linkElement.attribs.href, function (error, response, html) {
            if (!error) {
                schedule_counter +=1;
                var $ = cheerio.load(html);

                var schedule_categories = [];
                $('tr.Table__TR').filter(function () {
                    var data = $(this);
                    var schedule_columns = data.find('td');

                    for (var index = 0; index < schedule_columns.length; index++) {
                        var ele = schedule_columns[index];
                        var text = $(ele).text();
                        var textLower = text.toLowerCase();

                        if ( ( textLower.includes("wk") || textLower.includes("date") || textLower.includes("opponent") ) && schedule_categories.length < 3 ) {
                            schedule_categories.push(text);
                        }
                    }
                });
                    
                $('tr.Table__even, tr.Table__odd').filter(function () {
                    var data = $(this);

                    for (var index = 0; index < data.length; index++) {
                        var schedule_row = data[index];
                        var schedule_item = {};

                        for (var k = 0; k < data.find('td').length; k++) {
                            var td = data.find('td')[k];
                            var tdText = $(td).text();
                            var schedCatagory = schedule_categories[k];
                            if (k < 3) {
                                schedule_item[schedCatagory] = tdText;
                            }
                        }
                        regularseason.push(schedule_item);
                        // if (index < 4) {
                        //     preseason.push(schedule_item);
                        // } else {
                        //     regularseason.push(schedule_item)
                        // }
                    }
                });
                
                all_nfl_schedules[teamName] = {
                    "regularSeason": regularseason
                };
            
                console.log("Done getting schedules");
                // return roster;

                if (schedule_counter >= arrLen) {

                    fs.writeFile(choice + '_schedules.json', JSON.stringify(all_nfl_schedules, null, 4), function (err) {
                        console.log('File successfully written! - Check your project directory for the ' + choice + '.json file');
                    });

                    res.send('Finished Scraping ' + choice + ' Schedules!');
                }

            }//END if(!error)

        })//END request
    }

    function downloadLogos(urlElement, teamName) {
        var hrefLink = urlElement[0].attribs.src;
        var betterLink = hrefLink.replace(/&w=100&h=100/g, "");
        var filename = teamName.replace(/\s/g, "_").toLowerCase() + ".png";

        request(betterLink).pipe(fs.createWriteStream(filename)).on('close', 
            function() {
                //Callback function
                console.log("Downloaded " + teamName + '\'s logo');
            }
        );
    }


})//END app.get('/scrape')

app.listen('8081');
console.log('Magic happens on port 8081');
exports = module.exports = app;
