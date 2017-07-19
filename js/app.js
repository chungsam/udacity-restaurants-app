/* Callback function for fetching Google Maps Javascript API */
function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 4,
        center: {
            lat: -25.363,
            lng: 131.044
        }
    });
}

/* Main application */
$(function () {
    var ViewModel = function () {
        this.searchAddress = ko.observable("");
        this.searchRestaurant = ko.observable("");

        
    };

    ko.applyBindings(new ViewModel());
})