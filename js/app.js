/** Globals **/
var map,
  bounds,
  searchTextBox,
  largeInfoWindow,
  smallInfoWindow,
  currentLocation,
  placesService,
  geocoder,
  defaultCoords;
var allRestaurants = ko.observableArray();
var filteredRestaurants = ko.observableArray();
var allPlacesMarkers = [];
var currentRestaurant = ko.observable();
var errorMessage = ko.observable("");
var markerAnimationDuration = 2000;
// var defaultCoords = {
//   lat: 49.2823176,
//   lng: -123.1238306
// };

/** App entry point is the callback for fetching Google Maps Javascript API **/
function initMap() {
  /* Initial rendering of Google Map */
  var defaultZoomLevel = 15;

  defaultCoords = new google.maps.LatLng(49.2823176, -123.1238306);

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: defaultZoomLevel,
    center: defaultCoords
  });

  map.setOptions({
    draggable: true
  });

  var bounds = map.getBounds();

  /* Google Maps API Services */
  placesService = new google.maps.places.PlacesService(map);
  geocoder = new google.maps.Geocoder();

  /* Create search box for searching by keyword. */
  searchTextBox = new google.maps.places.SearchBox(
    document.getElementById("searchTextBox")
  );
  searchTextBox.setBounds(map.getBounds());

  /* Create single large infowindow so that only one shows up at a time. */
  largeInfoWindow = new google.maps.InfoWindow();

  loadSampleLocations();
}

/** Error callback for Google Maps API request */
function mapError() {
  displayErrorMessage("Error: The Google map wasn't successfuly retrieved.");
}

/** Load sample locations data on startup. The locations are retrieved from the node server. */
function loadSampleLocations() {
  $.ajax({
    url: "/api/sample-locations",
    data: {},
    success: function(data, status) {
      if (status === "success") {
        var sampleLocations = data.sampleLocations;

        createMarkersForMultiplePlaces(sampleLocations);
      }
    },
    error: function(error, status) {
      if (status === "error") {
        displayErrorMessage(
          "Error: There was an error in retrieving sample locations!"
        );
      }
    }
  });
}

/** Set the map to a particular location. **/
function setMapToLocation(location) {
  if (location) {
    map.setCenter(location);
    map.setZoom(15);
    searchTextBox.setBounds(map.getBounds());
  }
}

/** Use the HTML5 Geolocation API and set the map to the current location.
 *  Code largely taken from W3 "HTML5 Geolocation" example: https://www.w3schools.com/html/html5_geolocation.asp
 **/
function setMapToCurrentLocation() {
  var location;

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(pos) {
      location = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };

      setMapToLocation(location);
    }, handleError);
  } else {
    displayErrorMessage("Something went wrong with the Geolocation search.");
  }

  function handleError(error) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        displayErrorMessage("User denied the request for Geolocation.");
        break;
      case error.POSITION_UNAVAILABLE:
        displayErrorMessage("Location information is unavailable.");
        break;
      case error.TIMEOUT:
        displayErrorMessage("The request to get user location timed out.");
        break;
      case error.UNKNOWN_ERROR:
        displayErrorMessage("An unknown error occurred.");
        break;
    }
  }

  return location;
}

/** Get the current location, using the HTML5 Geolocation API**/
function getCurrentLocation() {
  //   var location;

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(pos) {
      var location = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      };

      return location;
    }, handleError);
  } else {
    displayErrorMessage("Geolocation failed, using default coordinates.");
    return defaultCoords;
  }

  function handleError(error) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        displayErrorMessage("User denied the request for Geolocation.");
        break;
      case error.POSITION_UNAVAILABLE:
        displayErrorMessage("Location information is unavailable.");
        break;
      case error.TIMEOUT:
        displayErrorMessage("The request to get user location timed out.");
        break;
      case error.UNKNOWN_ERROR:
        displayErrorMessage("An unknown error occurred.");
        break;
    }
  }
}

/** Use the Google Places text search API to search for places by keyword.
 *  Upon a successful query, we then create markers for each returned place.
 */
function searchByText(searchText) {
  removeMarkers(allPlacesMarkers);
  removeRestaurants(allRestaurants);

  bounds = map.getBounds();

  if (searchText === "") {
    displayErrorMessage("Please enter a search term.");
  } else {
    placesService.textSearch(
      {
        query: searchText,
        location: defaultCoords,
        type: ["food"],
        radius: 50
      },
      function(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          map.setCenter(results[0].geometry.location);

          /* Go ahead and create markers */
          createMarkersForMultiplePlaces(results);
        } else {
          alert("Sorry, there are no results");

          /* Reset markers and clear existing results */
          removeMarkers(allPlacesMarkers);
          removeRestaurants(allRestaurants);
        }
      }
    );
  }
}

/** Utility function for removing markers from the map. */
function removeMarkers(markers) {
  markers.forEach(function(marker) {
    marker.setMap(null);
  });

  markers = [];
}

/** Add a place to the allRestaurants array that is used to keep track of search results.
 *  Only add the place to the array if it doesn't already exist.
 */
function addPlaceToRestaurantsList(place) {
  /* Check if the place already exists in the allRestaurants observable array */
  var existingRestaurant = allRestaurants().find(function(restaurant) {
    return restaurant.place_id === place.place_id;
  });

  /* If it doesn't exist, add it */
  if (!existingRestaurant) {
    allRestaurants.push(place);
    filteredRestaurants.push(place);
  }
}

/** Creates markers on the map for an array of places, and assigns an info window
 * for the marker.
 *  The callback chain also includes a call to searchYelpBusiness to get additional
 * details from the Yelp Fusion API.
 * After all the info is gathered, we add the place object to our restaurants observable array
 * that is tracked by Knockout for client-side rendering.
 */
function createMarkersForMultiplePlaces(places) {
  var bounds = new google.maps.LatLngBounds();

  places.forEach(function(place) {
    /* Create instance of largeInfoWindow */
    largeInfoWindow = new google.maps.InfoWindow();

    /* Create a new marker */
    var marker = createMarkerForSinglePlace(place, largeInfoWindow);

    marker.addListener("click", function() {
      if (largeInfoWindow.marker === this) {
        // Don't do anything
      } else {
        // Populate the info window
        populateInfoWindow(this, largeInfoWindow);
      }
    });

    /* Simple animation when clicking a marker. 
        Taken from Google Maps Javascript API docs: https://developers.google.com/maps/documentation/javascript/examples/marker-animations
        */
    marker.addListener("click", toggleBounce);

    function toggleBounce() {
      if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
      } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        window.setTimeout(function() {
          marker.setAnimation(null);
        }, markerAnimationDuration);
      }
    }

    /* Search Yelp for additional business details and add results to the place object */
    searchYelpBusiness(place, function(data, status) {
      if (status === "success") {
        var yelpBusiness = data.businesses[0];

        if (yelpBusiness) {
          place.yelp = yelpBusiness;
        }
      }

      // Finally, add the place to our restaurants list
      addPlaceToRestaurantsList(place);
    });

    if (place.geometry.viewport) {
      bounds.union(place.geometry.viewport);
    } else {
      bounds.extend(place.geometry.location);
    }
  });

  map.fitBounds(bounds);
}

/** Create a marker for a single place. Called by createMarkersForMultiplePlaces(). */
function createMarkerForSinglePlace(place, infoWindow) {
  // Only create marker if marker for place hasn't already been created
  var existingMarker = getMarkerForPlace(place);

  if (!existingMarker) {
    var icon = {
      url: place.icon,
      size: new google.maps.Size(35, 35),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(15, 34),
      scaledSize: new google.maps.Size(25, 25)
    };

    var newMarker = new google.maps.Marker({
      map: map,
      icon: icon,
      title: place.name,
      position: place.geometry.location,
      id: place.place_id,
      animation: google.maps.Animation.DROP
    });

    allPlacesMarkers.push(newMarker);

    return newMarker;
  } else {
    return existingMarker;
  }
}

/** Filter map markers so only the ones matching the filter values are visible on the map. */
function filterMarkers(filteredPlaces) {
  /* First, make all markers invisible */
  allPlacesMarkers.forEach(function(marker) {
    marker.setVisible(false);
  });

  /* Next, make markers that match the filtered places visible */
  filteredPlaces.forEach(function(place) {
    allPlacesMarkers.forEach(function(marker) {
      if (marker.id === place.place_id) {
        marker.setVisible(true);
      }
    });
  });
}

/** Get an existing marker from our allPlacesMarkers list for a particular place */
function getMarkerForPlace(place) {
  var existingMarker = allPlacesMarkers.find(function(existingMarker) {
    return existingMarker.id === place.place_id;
  });

  return existingMarker;
}

/** Populate an info window using details retrieved from the Google Places Detail API
 *  and Yelp Fusion API.
 * Much of the code for this function was inspired by the code samples that are part
 *  of Udacity's Google Maps API course: https://github.com/udacity/ud864
 */
function populateInfoWindow(marker, largeInfoWindow) {
  /* First, let's get details from the Google Places Detail API */
  placesService.getDetails(
    {
      placeId: marker.id
    },
    function(place, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        // Prepare to populate info window content with the results
        var content = `<div>`;

        if (place.name) {
          if (place.website) {
            content += `<a href=${place.website} target="_blank">${
              place.name
            }</a>`;
          } else {
            content += `${place.name}`;
          }
        }

        if (place.types) {
          content += `  <span class="label label-default">${place.types[0]
            .charAt(0)
            .toUpperCase() + place.types[0].slice(1)}</span>`;
        }

        if (place.opening_hours) {
          if (place.opening_hours.open_now) {
            content += `  <span class="label label-success">Open Now</span>`;
          } else {
            content += `  <span class="label label-danger">Closed</span>`;
          }
        }

        if (place.formatted_address) {
          content += `<br><br><span>${place.formatted_address}</span>`;
        }

        if (place.formatted_phone_number) {
          content += `<br><span><a href="tel: ${
            place.formatted_phone_number
          }">${place.formatted_phone_number}</a></span>`;
        }

        if (place.website) {
          content += `<br><span><a href=${place.website}>${
            place.website
          }</a></span><br>`;
        }

        if (place.rating) {
          content += `<br><i class="fa fa-google" aria-hidden="true"></i> <span>Rating: ${place.rating.toFixed(
            1
          )}</span>`;
        }

        if (place.url) {
          content += ` <a class="btn btn-default btn-xs" href=${
            place.url
          } target="_blank">Open in GMaps</a>`;
        }

        /* Next, let's get some additional details from the Yelp Fusion API */
        searchYelpBusiness(place, function(data, status) {
          if (status === "success") {
            var yelpBusiness = data.businesses[0];

            if (yelpBusiness) {
              if (yelpBusiness.rating) {
                content += `<br><i class="fa fa-yelp" aria-hidden="true"></i> <span>Rating: ${yelpBusiness.rating.toFixed(
                  1
                )}</span>`;
              }

              if (yelpBusiness.url) {
                content += ` <a class="btn btn-default btn-xs" href=${
                  yelpBusiness.url
                } target="_blank">Open in Yelp</a>`;
              }
            }
          }

          /* Finally, make the re-orient the map and set the content to the info window*/
          map.setCenter(marker.getPosition());
          map.setZoom(15);

          // Assign the info window to the marker
          largeInfoWindow.marker = marker;
          largeInfoWindow.setContent(content);
          largeInfoWindow.open(map, marker);

          largeInfoWindow.addListener("click", function() {
            largeInfoWindow.open(map, marker);
          });

          largeInfoWindow.addListener("closeclick", function() {
            largeInfoWindow.marker = null;
          });
        });
      }
    }
  );
}

/** Reset the restaurants list observable array */
function removeRestaurants(allRestaurants) {
  allRestaurants([]);
}

function searchYelpBusiness(place, callback) {
  $.ajax({
    url: "/api/yelp/search/business",
    method: "POST",
    data: {
      location: place.formatted_address,
      term: `food ${place.name}`
    },
    success: function(data, status) {
      callback(data, status);
    },
    error: function(error, status) {
      displayErrorMessage("Error: Yelp business search was unsuccessful!");
    }
  });
}

function displayErrorMessage(message) {
  errorMessage(message);

  var htmlString = `<div class="alert alert-danger alert-dismissible error-alert" role="alert">
                <button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <span>${message}</span>
            </div>`;

  $("#error-message-container").html(htmlString);
}

/* Define Knockout ViewModel */
var ViewModel = function() {
  var defaultSearchQuery = "Italian restaurant";
  var self = this;

  self.allRestaurants = allRestaurants;
  self.filteredRestaurants = filteredRestaurants;
  self.allPlacesMarkers = allPlacesMarkers;
  self.errorMessage = errorMessage;

  // Default values for filters
  self.openClosedFilterValue = ko.observable("all");
  self.placeTypeFilterValue = ko.observable("all");

  self.currentLocation = ko.observable(getCurrentLocation());
  self.searchText = ko.observable(defaultSearchQuery);
  self.restaurantNameInput = ko.observable("");

  self.applyFilters = function() {
    // Remove existing filters
    self.filteredRestaurants(self.allRestaurants());

    var newlyFilteredPlaces = [];

    /* Implement filtering for open/closed filter */
    var openNow;
    if (self.openClosedFilterValue() === "open") {
      openNow = true;
    } else if (self.openClosedFilterValue() === "closed") {
      openNow = false;
    }

    switch (self.openClosedFilterValue()) {
      case "open":
      case "closed":
        newlyFilteredPlaces = self
          .filteredRestaurants()
          .filter(function(restaurant) {
            if (restaurant.opening_hours) {
              return restaurant.opening_hours.open_now === openNow;
            }
          });
        self.filteredRestaurants(newlyFilteredPlaces);
        break;
      case "all":
        break;
      default:
        break;
    }

    /* Implement filtering for place type filter */
    switch (self.placeTypeFilterValue()) {
      case "restaurant":
      case "cafe":
      case "bar":
        newlyFilteredPlaces = self
          .filteredRestaurants()
          .filter(function(restaurant) {
            if (restaurant.types) {
              return restaurant.types[0] === self.placeTypeFilterValue();
            }
          });
        self.filteredRestaurants(newlyFilteredPlaces);
        break;
      case "all":
        break;
      default:
        displayErrorMessage("Error: Invalid filter value.");
        break;
    }

    /* Finally, filter the markers */
    filterMarkers(self.filteredRestaurants());
  };

  self.populateInfoWindow = function(place) {
    var marker = getMarkerForPlace(place);

    /* Simple animation when clicking a marker. 
        Taken from Google Maps Javascript API docs: https://developers.google.com/maps/documentation/javascript/examples/marker-animations
        */
    function toggleBounce() {
      if (marker.getAnimation() !== null) {
        marker.setAnimation(null);
      } else {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        window.setTimeout(function() {
          marker.setAnimation(null);
        }, markerAnimationDuration);
      }
    }

    toggleBounce();

    populateInfoWindow(marker, largeInfoWindow);

    // Simple scroll to the map
    $("html, body").animate(
      {
        scrollTop: $("#map").offset().top
      },
      1000
    );
  };

  self.searchByText = function() {
    self.openClosedFilterValue("");
    self.allRestaurants([]);
    self.filteredRestaurants([]);

    searchByText(self.searchText());
  };

  self.clearCachedResults = function() {
    self.placeTypeFilterValue("all");
    self.openClosedFilterValue("all");
    self.allRestaurants([]);
    self.filteredRestaurants([]);
  };
};

ko.applyBindings(new ViewModel());
