# ESPN Web Scraper

1. First download the `server.js` and package.json`
2. Make sure you have NodeJs and npm installed on your machine
  * [NodeJS](https://nodejs.org/en/)
3. Move `server.js` and `package.json` to `C:\Users\<your user>\Documents\webscraper`
4. Open a `cmd` and type
  * ```npm install```
5. Once that has finished installing all the required packages, type ```node server.js```
  * That will start up the express server and you are almost ready to start scraping
6. Then in a browser navigate to 
```
http://localhost:8081/scrape?choice=NFL&roster=false&logo=false&schedule=false
```

# Choice
1. NFL
2. MLB
3. NBA
4. NCAA_FOOTBALL
5. NCAA_BASKETBALL

# Roster - Download the roster for the selected choice
1. True or False

# Logo - Download the team logos for the selected choice
1. True or False

# Schedule - Download the schedule for the selected choice
1. True or false

Once it has finished scraping you will see the results in the browser, so back to the `cmd` and type
```
ctrl + c
```
to end the program

You will see in the `C:\Users\<your user>\Documents\webscraper` that all the data is in there
