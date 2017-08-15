var request = require('request');

var yelpClientId = 'U6R4cTX3nwcEY73roFYqwg';
var yelpClientSecret = 'cNGBy6O6qZAaMuJkpj48kSCXMzA1tcPSL0eKEw9dd0bhCbCEtCz7hhiMsZ9rSDLf';

exports.getAccessToken = function(callback) {
    request({
            url: 'https://api.yelp.com/oauth2/token',
            method: 'POST',
            form: {
                'grant_type': 'client_credentials',
                'client_id': yelpClientId,
                'client_secret': yelpClientSecret
            }
        }, function (error, results) {
            if (error) {
                console.log("Access token error: " + error.message);
                return callback(new Error("Access Token Error"));
            }
            var json = JSON.parse(results.body);

            callback(error, results);
        });
}

exports.searchBusiness = function(accessToken, queryParams, callback) {
    request({
            url: 'https://api.yelp.com/v3/businesses/search',
            method: 'GET',
            headers: {
                "Authorization": 'Bearer ' + accessToken
            },
            qs: {
                location: queryParams.location,
                term: queryParams.term
            }
        },

        function (error, results) {
            if (error) {
                console.log(error);
                res.json({
                    "message": "Yelp business search error",
                    "error": error.message
                });
            }

            var json = JSON.parse(results.body);
            callback(error, results);
        }
    )

}