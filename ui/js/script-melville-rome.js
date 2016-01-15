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

    var $colors = new Array();
    $colors.push('#1438bd');
    $colors.push('#e9b829');
    $colors.push('#900503');
    $colors.push('#fb6b02');
    $colors.push('#038911');
    $colors.push('#281e5d');
    $colors.push('#f9a602');
    $colors.push('#d31603');
    $colors.push('#893201');
    $colors.push('#74b62d');
    $colors.push('#85144be');
    $colors.push('#141e3c');
    $colors.push('#311431');

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

                $pathLine.setStyle({color: $colors[i], weight: 6, opacity: 0.5});
                // switch (i) {
                //     case 0:
                //         $pathLine.setStyle({color: '#f00', weight: 5, opacity: 0.4});
                //         break;
                //     case 1:
                //         $pathLine.setStyle({color: '#0f0', weight: 5, opacity: 0.4});
                //         break;
                //     case 2:
                //         $pathLine.setStyle({color: '#00f', weight: 5, opacity: 0.4});
                //         break;
                //     default:
                //         $pathLine.setStyle({color: '#f00', weight: 5, opacity: 0.4});
                //         break;
                // }

                $paths.push(
                    {
                        'id' : $path.id,
                        'path' : $pathLine,
                        'content' : $path.content
                    }
                );
                $pathLine.bindPopup($path.content);
                $pathLine.on( 'click', function(e) {
                    $.each( $paths, function( $i, path ) {
                        path.path.setStyle({ weight: 6, opacity: .5 });
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
    var $waypointId = 1;
    var $waypointMarkers = new Array();;
    $.getJSON( '/itinerary/datajson/'+datajson, function (events) {
        console.log('pre-loop');
        // Store all our eventsmarker.marker.openPopup();
        var $itineraryData = events.events;
        // Loop through events
        $.each ($itineraryData, function(i, $event) {
            console.log($event);

            // Let's put locations on the map!

            if ( $event.latitude != '' && $event.longitude != '' && $event.type == 'w' )
            {
                console.log( $event.latitude );
                console.log( $event.longitude );

                var $marker = L.marker([$event.latitude, $event.longitude]).addTo(map);

                // If we store the event object here, we should have access to the entire event object
                // in our JS template...
                $waypointMarkers.push(
                    {
                        'id' : $waypointId,
                        'marker' : $marker,
                        'waypoint' : $event.waypoint,
                        'latitude' : $event.latitude,
                        'longitude' : $event.longitude
                    }
                )
                $waypointId++;

                // This needs to go in a template.
                $itineraryEventContent = '<h3>' + $event.waypoint + '</h3>';
                console.log($itineraryEventContent);
                // TODO: Roll up locations and observations for each event into the popup, using template approach
                // ...But that should really happen in the Jekyll-generated JSON file, so that we have a consistent
                // variable for the template to output.
                $marker.bindPopup( $itineraryEventContent );

            }
        })
        // TODO: This isn't working...How do we bind this?
        $.each( $waypointMarkers, function( $i, marker) {
            marker.marker.on('click', function(e) {
                $.each( $waypointMarkers, function( $i, marker) {
                    // This needs to go in a template.
                    marker.marker.bindPopup('<h3>' + marker.waypoint + '</h3>');
                });
                console.log(marker.waypoint);
                // This needs to go in a template.
                marker.marker.bindPopup('<h3>' + marker.waypoint + '</h3>');
                marker.marker.openPopup;
            })
        });
    }).fail(function( jqxhr, textStatus, error ) {
        var err = textStatus + ", " + error;
        //console.log( "Request Failed: " + err );
    })

    $(".waypoint a").on('click', function(e) {
        //e.preventDefault(); // Let the # link scroll us to the top
        var $waypoint = $(this).data('waypoint-id');
        var $waypointName = $(this).html();
        var $waypointId = $(this).data('waypoint-id').split('-')[1];
        var $itinerarySequence = $(this).data('waypoint-id');

        //currentEvent($itinerarySequence, $parishPolygons, $itineraryData, $locationMarkers);
        // Per Itinerary I, this can go in a function
        $.each( $paths, function( $i, path) {
            path.path.closePopup();
        })
        $.each( $waypointMarkers, function( $i, marker) {
            marker.marker.closePopup();
            // This needs to go in a template.
            marker.marker.bindPopup('<h3>' + marker.waypoint + '</h3>');
        });
        $.each( $waypointMarkers, function( $i, marker ) {
            if ($i+1 == $waypointId)
            {
                // This needs to go in a template
                $popup = '<div style="max-height: 175px; overflow-y: scroll;">';
                console.log($waypointName);
                // This should be the itemName field in a template.
                $popup += '<h3>' + $waypointName + '</h3>';
                $.each( $('tr.'+$waypoint), function( $i, tr ) {
                    console.log(tr);
                    // All of the following should be the itemContent for events that match the waypoint.
                    // But we need to go back to the JSON for those.
                    // The Jekyll-driven JSON file should apply the if empty logic and HTML markup in its loop.
                    // Then we just have a handful of itemContent vars to line up.
                    // This should be the itemContent field in a template.
                    ($(tr).children('td.date').html().length == 0) ? console.log('Empty') : console.log($(tr).children('td.date').html());
                    if ( $(tr).children('td.date').html().length > 0 )
                        $popup += '<p><b>' + $(tr).children('td.date').html() + '</b></p>';
                    ($(tr).children('td.location').html().length == 0) ? console.log('Empty') : console.log($(tr).children('td.location').html());
                    if ( $(tr).children('td.location').html().length > 0 )
                        $popup += '<p>' + $(tr).children('td.location').html() + '</p>';
                    ($(tr).children('td.observation').html().length == 0) ? console.log('Empty') : console.log($(tr).children('td.observation').html());
                    if ( $(tr).children('td.observation').html().length > 0 )
                        $popup += '<p><i>' + $(tr).children('td.observation').html() + '</i></p>';
                    ($(tr).children('td.text').html().length == 0) ? console.log('Empty') : console.log($(tr).children('td.text').html());
                    if ( $(tr).children('td.text').html().length > 0 )
                        $popup += '<p><i>' + $(tr).children('td.text').html() + '</i></p>';
                } )
                // This needs to go in a template.
                $popup += '</div>';
                marker.marker.bindPopup($popup);
                marker.marker.openPopup();
            }
        })
    })
})
