var express = require('express');
var path = require('path');
var port = process.env.PORT || 3000;

/* Node Modules */
var bodyParser = require('body-parser');
var request = require('request');
var NodeCache = require('node-cache');
var appCache = new NodeCache();

/* App-specific modules */
// Local module for making calls to Yelp Fusion API
var sampleData = require('../data/sampleLocations.js');
var yelpApiService = require('./services/yelpApiService.js');

var app = express();

/* Express middleware */
// Body Parser
app.use(bodyParser.urlencoded({
    extended: false
}));

/* Serve static files */
app.use('/lib', express.static(path.join(__dirname + '/../lib')));
app.use('/css', express.static(path.join(__dirname + '/../css')));
app.use('/js', express.static(path.join(__dirname + '/../js')));
app.use('/data', express.static(path.join(__dirname + '/../data')));

// Make initial call to Yelp API and store access token in storage
yelpApiService.getAccessToken(function (err, results) {
    if (err) {
        return console.log("Access token error");
    }

    var json = JSON.parse(results.body);
    appCache.set('yelpAccessToken', json.access_token, json.expires_in);
})

/* Routes */
app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/../index.html'));
})

app.get('/api/sample-locations', function (req, res) {
    res.json(sampleData);
})

// Route for calling Yelp API business search
app.post('/api/yelp/search/business', function (req, res) {
    var accessToken = appCache.get('yelpAccessToken');
    var queryParams = req.body;

    yelpApiService.searchBusiness(accessToken, queryParams, function (err, results) {
        if (err) {
            return console.log("search business error");
        }

        var json = JSON.parse(results.body);
        return res.send(json);
    })

})

// Start server
app.listen(port, function () {
    console.log("Server started, listening on port " + port);
})