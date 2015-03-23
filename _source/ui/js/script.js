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
        'London 2015': map_mapbox,
        'Historic Map': map_historic
    };

    // Add the tile layer switcher control (toggler)
    L.control.layers(baseMaps).addTo(map);

    // Zoom and center in
    // TODO: Make this dynamic based on the map's contents
    map.setView(map_center, map_zoom);

    // TODO: Code for single location markers
    // var testMarker = L.marker([51.5133631072273, -0.0889500975608826]).addTo(map);
    // testMarker.bindPopup("This is <b>formatted</b> content about this location.").openPopup();

    $.getJSON( 'datajson/'+datajson, function (events) {
        // Store all our events
        var $itineraryData = events.events;
        // And set a pointer for prev/next
        $itineraryIndex = 0;

        // Let's put locations on the map!

        var $locationMarkers = new Array();

        $.each( $itineraryData, function(i, $event) {
            if ($event.location_latitude != '' && $event.location_longitude != '')
            {
                var $marker = L.marker([$event.location_latitude, $event.location_longitude]).addTo(map);

                var $itineraryEventContent = '';
                $itineraryEventContent =  '<div style="max-height: 175px; overflow-y: scroll;">';
                $itineraryEventContent += "<h3>" + $event.parish + "</h3>";
                $itineraryEventContent += '<p>';
                if ($event.date_descriptive != '')
                    $itineraryEventContent += $event.date_descriptive + '<br />';
                if ($event.location_descriptive != '')
                    $itineraryEventContent += $event.location_descriptive + '<br />';
                if ($event.buried_parish_total != '')
                    $itineraryEventContent += '<span style="color: #d31603;">Buried Parish: ' + $event.buried_parish_total + '</span><br />';
                if ($event.notes != '')
                    $itineraryEventContent += $event.notes + '<br />';
                $itineraryEventContent += '</p>';
                $itineraryEventContent += '</div>';
                $marker.bindPopup( $itineraryEventContent );

                $locationMarkers.push(
                    {
                        'marker' : $marker,
                        'latitude' : $event.location_latitude,
                        'longitude' : $event.location_longitude
                    }
                )
            }
        })

        // Let's put some parishes on the map!
        var $parishPolygons = new Array();

        // Fetch all the parishes to put them on the map
        $.getJSON( "datajson/parishes.json", function (parishes) {
            $.each( parishes.parishes, function(i, $parish) {
                // Reset the vertices for each parish
                var $vertices = [];
                // Reset the default popup content for each parish
                var $parishPopUp = '';

                // Knowing we have our itinerary data, lets get the vertices for each parish as geoJson
                $.getJSON( "geojson/parish-"+$parish.id+".geojson", function (geodata) {

                    // For each vertex in the parish polygon, get its coordinates
                    $.each(geodata.features, function(i, $feature) {
                        $vertices.push([ $feature.geometry.coordinates[1], $feature.geometry.coordinates[0] ]);
                    })

                    // Create a map polygon with that data and the color for that parish
                    var $polygon = L.polygon([ $vertices ], { color: $parish.color }).addTo(map);
                    // Load up our default infoPanel content
                    $parishPopUp =  '<div style="max-height: 175px; overflow-y: scroll;">';
                    $parishPopUp += "<h3>" + $parish.parish_name + "</h3>";
                    $parishPopUp += '</div>';
                    // Push the new map polygon into an array to access it later on
                    $parishPolygons.push(
                        {
                            'id' : $parish.id,
                            'polygon' : $polygon,
                            'color' : $parish.color,
                            'content' : $parishPopUp
                        }
                    )
                    $polygon.bindPopup( $parishPopUp );

                }).fail(function( jqxhr, textStatus, error ) {
                    var err = textStatus + ", " + error;
                    console.log( "Request Failed: " + err );
                })
            })
            // After all our parishes are drawn...
            // Let's load up our timeline stepper!
            // currentEvent lights up a parish, but also refreshes the timeline stepper
            // Set up our first event
            currentEvent(0, $parishPolygons, $itineraryData, $locationMarkers);

        }).fail(function( jqxhr, textStatus, error ) {
            var err = textStatus + ", " + error;
            console.log( "Request Failed: " + err );
        })

        // When prev is clicked
        $('#stepper a#step-prev').on('click', function(e) {
            e.preventDefault();
            if ( $itineraryIndex > 0) {
                $itineraryIndex--;
                currentEvent($itineraryIndex, $parishPolygons, $itineraryData, $locationMarkers);
            }
        });

        // When next is clicked
        $('#stepper a#step-next').on('click', function(e) {
            console.log('click');
            e.preventDefault();
            if ( $itineraryIndex < $itineraryData.length) {
                $itineraryIndex++;
                currentEvent($itineraryIndex, $parishPolygons, $itineraryData, $locationMarkers);
            }
        });

        // When a parish in the data table is clicked
        $("a.parish-name").on('click', function(e) {
            //e.preventDefault(); // Let the # link scroll us to the top
            var $parishId = $(this).data('parish-id');
            $.each( $parishPolygons, function( $i, polygon) {
                if (polygon.id==$parishId) {
                    polygon.polygon.openPopup();
                }
            })
        })

    }).fail(function( jqxhr, textStatus, error ) {
        var err = textStatus + ", " + error;
        console.log( "Request Failed: " + err );
    });

    function currentEvent($itineraryIndex, $parishPolygons, $itineraryData, $locationMarkers) {

        // reset all polygons on each step
        $.each( $parishPolygons, function( $i, polygon) {
            polygon.polygon.setStyle({'color': polygon.color});
            polygon.polygon.closePopup();
            polygon.polygon.bindPopup( polygon.content );
        });

        $speed = 175;

        // Ultimately this should all use a template system (http://underscorejs.org/#template) but MVP!
        // Use fadeOut / fadeIn so it's clear we're stepping when the date and parish name might be the same as previous
        if ($('#stepper h2').text() != $itineraryData[$itineraryIndex].year)
            $('#stepper h2').fadeOut($speed, function(){ $(this).text($itineraryData[$itineraryIndex].year).fadeIn($speed) });
        $('#stepper p').fadeOut($speed,
            function() {
                // Update the HTML contents with the prev/next itinerary event
                $(this).html(
                    $itineraryData[$itineraryIndex].date_descriptive + '<br />' + $itineraryData[$itineraryIndex].location_descriptive + " " + $itineraryData[$itineraryIndex].parish + '<span class="buried-parish">' + $itineraryData[$itineraryIndex].buried_parish_total + '</span>'
                ).fadeIn($speed);
                $.each( $locationMarkers, function( $i, marker ) {
                    console.log($itineraryData[$itineraryIndex].location_latitude);
                    if (marker.latitude == $itineraryData[$itineraryIndex].location_latitude && marker.longitude == $itineraryData[$itineraryIndex].location_longitude) {
                        marker.marker.openPopup();
                    }
                })
                $.each( $parishPolygons, function( $i, polygon ) {
                    // Find the current parish polygon, light it up and change its content
                    if (polygon.id==$itineraryData[$itineraryIndex].parish_id) {
                        polygon.polygon.setStyle({'color': '#d31603'});
                        var $itineraryEventContent = '';
                        $itineraryEventContent =  '<div style="max-height: 175px; overflow-y: scroll;">';
                        $itineraryEventContent += "<h3>" + $itineraryData[$itineraryIndex].parish + "</h3>";
                        $itineraryEventContent += '<p>';
                        if ($itineraryData[$itineraryIndex].date_descriptive != '')
                            $itineraryEventContent += $itineraryData[$itineraryIndex].date_descriptive + '<br />';
                        if ($itineraryData[$itineraryIndex].location_descriptive != '')
                            $itineraryEventContent += $itineraryData[$itineraryIndex].location_descriptive + '<br />';
                        if ($itineraryData[$itineraryIndex].buried_parish_total != '')
                            $itineraryEventContent += '<span style="color: #d31603;">Buried Parish: ' + $itineraryData[$itineraryIndex].buried_parish_total + '</span><br />';
                        if ($itineraryData[$itineraryIndex].notes != '')
                            $itineraryEventContent += $itineraryData[$itineraryIndex].notes + '<br />';
                        $itineraryEventContent += '</p>';
                        $itineraryEventContent += '</div>';
                        polygon.polygon.bindPopup( $itineraryEventContent );
                        polygon.polygon.openPopup();
                    }
                });
            })
    }

    // Not used...yet?
    function getParish($parishPolygons, $parishId)
    {
        $.each( $parishPolygons, function( $i, polygon) {
            if (polygon.id==$parishId)
                return polygon;
        });
    }

})