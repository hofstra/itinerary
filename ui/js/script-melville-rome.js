$(document).ready(function() {

    var map_historic = L.tileLayer( tile_layer_historic, { attribution: attribution_historic } );
    var map_mapbox = L.tileLayer( tile_layer_mapbox, {id: mapbox_id, attribution: attribution_mapbox});

    var map = L.map('map-container', {layers:map_historic});

    // Setting the map interaction defaults. I find that when using a map that fills the page, allowing zoom based on scroll wheel, which is also used to scroll up and down the page, is problematic.
    map.dragging.enable();
    map.touchZoom.disable();
    map.doubleClickZoom.enable();
    map.scrollWheelZoom.disable();

    // Create a variable to hold all tile sets and name them so we can use it for the toggler
    // Chrome is balking at this!!!
    /*var baseMaps = {
        [modern_toggle_label]: map_mapbox,
        [historic_toggle_label]: map_historic
    };*/
    var baseMaps = {
        'Rome 2015': map_mapbox,
        'Historic Map': map_historic
    };

    // Add the tile layer switcher control (toggler)
    L.control.layers(baseMaps).addTo(map);

    // Zoom and center in
    // TODO: Make this dynamic based on the map's contents
    map.setView(map_center, map_zoom);

    console.log('pre-json');
    $.getJSON( '/itinerary/datajson/'+datajson, function (events) {
        console.log('pre-loop');
        // Store all our events
        var $itineraryData = events.events;
        // Loop through events
        $.each ($itineraryData, function(i, $event) {
            console.log($event);

            // Let's put locations on the map!
            var $locationMarkers = new Array();

            if ($event.latitude != '' && $event.longitude != '')
            {
                console.log( $event.latitude );
                console.log( $event.longitude );

                var $marker = L.marker([$event.latitude, $event.longitude]).addTo(map);

                // If we store the event object here, we should have access to the entire event object
                // in our JS template...
                $locationMarkers.push(
                    {
                        'marker' : $marker,
                        'latitude' : $event.latitude,
                        'longitude' : $event.longitude
                    }
                )

                // Fetch and fill in template here
                $itineraryEventContent = '';
                $marker.bindPopup( $itineraryEventContent );

            }
        })
    }).fail(function( jqxhr, textStatus, error ) {
        var err = textStatus + ", " + error;
        //console.log( "Request Failed: " + err );
    })

})
