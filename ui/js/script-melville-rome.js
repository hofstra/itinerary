$(document).ready(function() {

    var map = L.map('map-container', {layers:map_historic});

    // Setting the map interaction defaults. I find that when using a map that fills the page, allowing zoom based on scroll wheel, which is also used to scroll up and down the page, is problematic.
    map.dragging.enable();
    map.touchZoom.disable();
    map.doubleClickZoom.enable();
    map.scrollWheelZoom.disable();

    // Add the tile layer switcher control (toggler)
    L.control.layers(baseMaps).addTo(map);

    // Zoom and center in
    // TODO: Make this dynamic based on the map's contents
    map.setView(map_center, map_zoom);

    var $paths = new Array();

    $.getJSON( "/itinerary/datajson/paths.json", function (paths) {
        $.each( paths.paths, function(i, $path) {
            $.getJSON( '/itinerary/geojson/path-'+$path.route+'-'+$path.event+'-'+$path.id+'.geojson', function (geodata) {
                console.log(geodata);
                var $vertices = [];
                $.each(geodata.features, function(i, $feature) {
                    $.each($feature.geometry['coordinates'], function(i, $coordinates) {
                        $vertices.push([ $coordinates[1], $coordinates[0] ]);
                    })
                })
                var $pathLine = L.polyline($vertices).addTo(map);

                // It's too bad this doesn't work as a featureLayer where we can just load in GeoJson! But then we have a layer of objects; Not each object.
                //var linelayer = L.mapbox.featureLayer().addTo(map);
                //linelayer.setGeoJSON(data);
                switch (i) {
                    case 0:
                        $pathLine.setStyle({color: '#f00', weight: 5, opacity: 0.4});
                        break;
                    case 1:
                        $pathLine.setStyle({color: '#0f0', weight: 5, opacity: 0.4});
                        break;
                    case 2:
                        $pathLine.setStyle({color: '#00f', weight: 5, opacity: 0.4});
                        break;
                    default:
                        $pathLine.setStyle({color: '#f00', weight: 5, opacity: 0.4});
                        break;
                }
                $paths.push(
                    {
                        'id' : $path.id,
                        'path' : $pathLine,
                        'content' : $path.content
                    }
                );
                $pathLine.bindPopup($paths[i].content);
                $pathLine.on( 'click', function(e) {
                    $.each( $paths, function( $i, path ) {
                        path.path.setStyle({ weight: 5, opacity: .4 });
                    })
                    $pathLine.setStyle({ weight: 3, opacity: 1.0 });
                })
            }).fail(function( jqxhr, textStatus, error ) {
                var err = textStatus + ", " + error;
                //console.log( "Request Failed: " + err );
            });
        })
    }).fail(function( jqxhr, textStatus, error ) {
        var err = textStatus + ", " + error;
        //console.log( "Request Failed: " + err );
    });

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

            if ( $event.latitude != '' && $event.longitude != '' && $event.type == 'w' )
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
                $itineraryEventContent = $event.waypoint;
                console.log($itineraryEventContent);
                // TODO: Roll up locations and observations for each event into the popup, using template approach
                // ...But that should really happen in the Jekyll-generated JSON file, so that we have a consistent
                // variable for the template to output.
                $marker.bindPopup( $itineraryEventContent );

            }
        })
    }).fail(function( jqxhr, textStatus, error ) {
        var err = textStatus + ", " + error;
        //console.log( "Request Failed: " + err );
    })

    // TODO: Enable links from Itinerary below to pop open map pins

})
