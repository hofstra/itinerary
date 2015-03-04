var attribution_1667 = 'Map image from <a href="#">Hofstra DRC</a> via <a href=#">Source</a>';
var attribution_1720 = 'Map image from <a href="#">Hofstra DRC</a> via <a href=#">Source</a>';
var attribution_2015 = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, Imagery © <a href="http://mapbox.com">Mapbox</a>';

// Rectified MapWarper.net map
var survey_1667 = L.tileLayer( 'http://mapwarper.net/maps/tile/8221/{z}/{x}/{y}.png' , { attribution: attribution_1667 } );
// Rectified MapWarper.net map
var survey_1720 = L.tileLayer( 'http://mapwarper.net/maps/tile/8663/{z}/{x}/{y}.png' , { attribution: attribution_1720 } );
// MapBox max configured via Clearbold login
var london_2015 = L.tileLayer( 'https://{s}.tiles.mapbox.com/v3/{id}/{z}/{x}/{y}.png',{id: 'clearbold.l4gjpd88',attribution: attribution_2015});

// Create the map with the default tileset
var map = L.map('map', {layers:survey_1720});

// Setting the map interaction defaults. I find that when using a map that fills the page, allowing zoom based on scroll wheel, which is also used to scroll up and down the page, is problematic.
map.dragging.enable();
map.touchZoom.disable();
map.doubleClickZoom.enable();
map.scrollWheelZoom.disable();

// Create a variable to hold all tile sets and name them so we can use it for the toggler
var baseMaps = {
    "London 2015": london_2015,
    "Surveigh 1720": survey_1720
};

// Add the tile set switcher control (toggler)
L.control.layers(baseMaps).addTo(map);

// Zoom and center in
// TODO: Make this dynamic based on the maps contents
map.setView([51.514, -0.0881481171],14);

// TODO: Code for single location markers
// var testMarker = L.marker([51.5133631072273, -0.0889500975608826]).addTo(map);
// testMarker.bindPopup("This is <b>formatted</b> content about this location.").openPopup();