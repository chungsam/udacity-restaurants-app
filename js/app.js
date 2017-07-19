function initMap() {
    var map = new google.maps.Map(document.getElementById('map'), {
        zoom: 4,
        center: {
            lat: -25.363,
            lng: 131.044
        }
    });
}

var viewModel = function() {

};

ko.applyBindings(new ViewModel());