/** Globals **/
var map, searchTextBox, infoWindow, currentLocation, placesService, geocoder;
var foodMarkers = [];

/** App entry point is the callback for fetching Google Maps Javascript API **/
function initMap() {
    /* Initial rendering of Google Map */
    var defaultCoords = {
        lat: 49.2823176,
        lng: -123.1238306
    };
    var defaultZoomLevel = 15;

    map = new google.maps.Map(document.getElementById('map'), {
        zoom: defaultZoomLevel,
        center: defaultCoords
    });

    /* Google Maps API Services */
    placesService = new google.maps.places.PlacesService(map);
    geocoder = new google.maps.Geocoder();

    /* Create search box for searching by keyword */
    searchTextBox = new google.maps.places.SearchBox(document.getElementById('searchTextBox'));
    searchTextBox.setBounds(map.getBounds());

}

function setMapToLocation(location) {
    if (location) {
        map.setCenter(location);
        map.setZoom(15);
        searchTextBox.setBounds(map.getBounds());
    }
}

function setMapToCurrentLocation() {
    var location;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (pos) {
            location = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
            };

            setMapToLocation(location);
        }, handleError);
    }

    function handleError(error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                alert("User denied the request for Geolocation.");
                break;
            case error.POSITION_UNAVAILABLE:
                alert("Location information is unavailable.");
                break;
            case error.TIMEOUT:
                alert("The request to get user location timed out.");
                break;
            case error.UNKNOWN_ERROR:
                alert("An unknown error occurred.");
                break;
        }
    }

    return location;
}

function getCurrentLocation() {
    var location;

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (pos) {
            location = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
            };

            return location;
        }, handleError);
    }

    function handleError(error) {
        switch (error.code) {
            case error.PERMISSION_DENIED:
                alert("User denied the request for Geolocation.");
                break;
            case error.POSITION_UNAVAILABLE:
                alert("Location information is unavailable.");
                break;
            case error.TIMEOUT:
                alert("The request to get user location timed out.");
                break;
            case error.UNKNOWN_ERROR:
                alert("An unknown error occurred.");
                break;
        }
    }

}

function getGeoCodeLocation(address) {
    if (address == '') {
        window.alert('Please enter in an address');
    } else {
        geocoder.geocode({
            address: address
        }, function (results, status) {
            if (status === google.maps.GeocoderStatus.OK) {
                console.log(results);
                console.log(results[0].geometry.location);
                return results[0].geometry.location;
            } else {
                console.log(results);
                window.alert('Sorry, there are no results for that address');
            }
        })
    }
};

function searchByText(searchText) {
    removeMarkers(foodMarkers);

    var bounds = map.getBounds();

    if (searchText == '') {
        window.alert('Please enter in a search keyword (e.g. Italian');
    } else {
        placesService.textSearch({
            query: searchText,
            bounds: bounds,
            type: ['food']
            // radius: 500
        }, function (results, status) {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                map.setCenter(results[0].geometry.location);
                createMarkersForPlaces(results);
            }
        });
    }

};

function removeMarkers(markers) {
    markers.forEach(function (marker) {
        marker.setMap(null);
    })
}

function getNearbyRestaurants(location) {

    var options = {
        location: location,
        radius: 500,
        type: ['food']
    };

    var callback = function (results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            console.log(results);
            return results;
        }
    }

    placesService.nearbySearch(options, callback);
}

function createMarkersForPlaces(places) {
    var bounds = new google.maps.LatLngBounds();

    places.forEach(function (place) {
        var icon = {
            url: place.icon,
            size: new google.maps.Size(35, 35),
            origin: new google.maps.Point(0, 0),
            anchor: new google.maps.Point(15, 34),
            scaledSize: new google.maps.Size(25, 25)
        };

        var marker = new google.maps.Marker({
            map: map,
            icon: icon,
            title: place.name,
            animation: google.maps.Animation.DROP,
            position: place.geometry.location,
            id: place.place_id
        });

        var smallInfoWindow = new google.maps.InfoWindow();

        getPlaceDetail(marker, smallInfoWindow);


        marker.addListener('click', function () {
            if (smallInfoWindow.marker == this) {
                // don't do anything
            } else {
                getPlaceDetail(this, smallInfoWindow);
            }
        });

        foodMarkers.push(marker);

        if (place.geometry.viewport) {
            bounds.union(place.geometry.viewport);
        } else {
            bounds.extend(place.geometry.location);
        }
    })

    map.fitBounds(bounds);

}

function getPlaceDetail(marker, infoWindow) {
    placesService.getDetails({
        placeId: marker.id,
    }, function (place, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
            console.log(place);
            var content = "<div>";

            if (place.name) {
                if (place.website) {
                    content += `<strong><a href=${place.website} target="_blank">${place.name}</a></strong>`;

                } else {
                    content += `<strong>${place.name}</strong>`;
                }
            }

            if (place.types) {
                var type = place.types[0];
                // Display in nice format          
                content += `<br><span>${type.charAt(0).toUpperCase() + type.slice(1)}</span>`
            }

            if (place.rating) {
                content += `<br><strong>Rating:</strong> <span>${place.rating}</span>`
            }

            // if (place.formatted_address) {
            //     content += `<br><span>${place.formatted_address}</span>`;
            // }

            // if (place.formatted_phone_number) {
            //     content += `<br><span><a href="tel: ${place.formatted_phone_number}">${place.formatted_phone_number}</a></span>`;
            // }

            // if (place.website) {
            //     content += `<br><span><a href=${place.website}>${place.website}</a></span>`
            // }

            // Add button for details
            content += `<br><button type="button" class="btn btn-default btn-xs">Details</button>`

            infoWindow.marker = marker;
            infoWindow.setContent(content);
            infoWindow.open(map, marker);
        }

        infoWindow.addListener('closeclick', function () {
            infoWindow.marker = null;
        });
    });
}

/* Define Knockout ViewModel */
var ViewModel = function () {
    // this.restaurants = ko.observableArray(restaurants);
    this.currentLocation = ko.observable(getCurrentLocation());
    this.searchText = ko.observable();
    this.restaurantNameInput = ko.observable("");

    this.setMapToLocation = function () {
        setMapToLocation({
            lat: 49.2823176,
            lng: -123.1238306
        });
    }

    this.searchByText = function () {
        searchByText(this.searchText());
    };

    this.searchByRestaurantName = function () {

    };

};

ko.applyBindings(new ViewModel());