var request = require('request');
var YELP_API_KEY = 'sWAhHYpkLjU5xsTFeLS3RAqzN-Bo2tZbvJJSoMZ7B3UbyHVkHX-2KWUGndwQZ9n5xcz3PwTXr_q5OGfzv3rm8_VCobymglYUvXn2MV0PJMIcgCTb57R4GMxFrlMCW3Yx';

/* As of December 7, 2017 Yelp no longer uses OAuth 2.0 for authentication but now uses Api keys
var yelpClientId = 'U6R4cTX3nwcEY73roFYqwg';
var yelpClientSecret = 'cNGBy6O6qZAaMuJkpj48kSCXMzA1tcPSL0eKEw9dd0bhCbCEtCz7hhiMsZ9rSDLf';
*/

// No longer needed
// exports.getAccessToken = function(callback) {
//     request({
//             url: 'https://api.yelp.com/oauth2/token',
//             method: 'POST',
//             form: {
//                 'grant_type': 'client_credentials',
//                 'client_id': yelpClientId,
//                 'client_secret': yelpClientSecret
//             }
//         }, function (error, results) {
//             if (error) {
//                 console.log("Access token error: " + error.message);
//                 return callback(new Error("Access Token Error"));
//             }
//             var json = JSON.parse(results.body);

//             callback(error, results);
//         });
// }


exports.searchBusiness = function(queryParams, callback) {
    request({
            url: 'https://api.yelp.com/v3/businesses/search',
            method: 'GET',
            headers: {
                "Authorization": 'Bearer ' + YELP_API_KEY
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