# Udacity FEND Neighbourhood Map Project - Restaurants App

### By Sam Chung

## Introduction
This is a simple, responsive web app that allows you to look up restaurants using the Google Maps JavaScript API. It also uses the Yelp Fusion API to provide additional details about the places you search for.

### Front-End
The app uses Bootstrap for layout and styling, and uses knockout.js for two-way data binding.

### Back-End
A node/express server serves the app and all required static files. There's also an internal api that serves the initial sample location data that gets loaded on startup, and is used to make calls to the Yelp Fusion API.

## Getting Started
To get started, first install dependencies using npm:
```
> npm install
```
Next, run the app:
```
> npm start
```

## Additional Notes
* The searchbox functionality contains numerous bugs in which search results are not localized properly, autocomplete is not contained to food-related results, etc. These bugs will be fixed in future releases.

* A sample list of locations is provided in [data/sampleLocations.js](data/sampleLocations.js). This is the array of locations that gets loaded on startup. The server provides these locations through an internal api call made by the client.

* Calls to the Yelp Fusion API were implemented server-side in order to avoid CORS errors. Calls are first made by an internal api call to the server from the client. The server then makes the actual call to the Yelp Fusion API endpoint, retrieves the results, and then sends them back to the client.