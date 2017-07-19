var map, infoWindow;
var defaultCoords = {
    lat: 50.891853,
    lng: -130.0975733
};

var defaultZoomLevel = 15;

/** App entry point is the callback for fetching Google Maps Javascript API **/
function initMap() {
    var currentLocation = getCurrentLocation();

    /* Initial rendering of Google Map */
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 8,
        center: defaultCoords
    });

    /* Google Places API Service */
    var placesService = new google.maps.places.PlacesService(map);

    placesService.nearbySearch({
        location: defaultCoords,
        radius: 5000,
        type: ['food']
    }, function (data) {
        console.log(data);
    });
}

function getCurrentLocation() {
    var location = {};

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (pos) {
            location = pos;

            map = new google.maps.Map(document.getElementById('map'), {
                zoom: defaultZoomLevel,
                center: {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                }
            });
        });
    } else {
        map = new google.maps.Map(document.getElementById('map'), {
            zoom: defaultZoomLevel,
            center: defaultCoords
        });
    };

    return location;
}

function createMarker() {

}

/* Define Knockout ViewModel */
var ViewModel = function () {
    // this.restaurants = ko.observableArray(restaurants);
    this.currentLocation = ko.observable(getCurrentLocation());
    this.addressInput = ko.observable("test");
    this.restaurantNameInput = ko.observable("");

    this.searchByAddress = function () {
        searchByAddress(this.addressInput);
    };

    this.searchByRestaurantName = function () {

    };

};

ko.applyBindings(new ViewModel());