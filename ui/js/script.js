function applyTemplate($templateName, $itemName, $itemContent)
{
    $template = $('.js-templates .'+$templateName).html();
    $template = $template.replace('[% itemName %]', $itemName).replace('[% itemContent %]', $itemContent);
    return $template;
}

$(document).ready(function() {

    // Load the map into the div specified.
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

    $.getJSON( 'datajson/'+datajson, function (events) {
        // Store all our events
        var $itineraryData = events.events;
        // And set a pointer for prev/next
        $itineraryIndex = 0;

        // Let's put locations on the map!
        var $locationMarkers = new Array();

        $timelineEventWidth = 100 / $itineraryData.length;

        $.each( $itineraryData, function(i, $event) {

            var $timelineEventShape = '';
            $timelineEventShape = '<a href="#" class="timeline-event" style="width: 4px;"><span></span></a>';
            $( $timelineEventShape ).appendTo(".timeline");

            if ($event.location_latitude != '' && $event.location_longitude != '')
            {
                var $marker = L.marker([$event.location_latitude, $event.location_longitude]).addTo(map);
                $popup = applyTemplate('pin-event', '', $event.content);
                $marker.bindPopup( $popup );

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
                    $parishPopUp = applyTemplate('pin-event', $parish.parish_name, '');
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
                })
            })
            // After all our parishes are drawn...
            // Let's load up our timeline stepper!
            // currentEvent lights up a parish, but also refreshes the timeline stepper
            // Set up our first event
            currentEvent(0, $parishPolygons, $itineraryData, $locationMarkers);

        }).fail(function( jqxhr, textStatus, error ) {
            var err = textStatus + ", " + error;
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
            e.preventDefault();
            if ( $itineraryIndex < $itineraryData.length) {
                $itineraryIndex++;
                currentEvent($itineraryIndex, $parishPolygons, $itineraryData, $locationMarkers);
            }
        });

        $('.timeline-event').on('click', function(e) {
            e.preventDefault();
            console.log($(this).index());
            $itineraryIndex = $(this).index();
            currentEvent($(this).index(), $parishPolygons, $itineraryData, $locationMarkers);
        })

        // When a parish in the data table is clicked
        $("a.parish-name").on('click', function(e) {
            //e.preventDefault(); // Let the # link scroll us to the top
            var $parishId = $(this).data('parish-id');
            var $itinerarySequence = $(this).data('event-id');
            currentEvent($itinerarySequence, $parishPolygons, $itineraryData, $locationMarkers);
        })

        // When a location in the data table is clicked
        $("a.location-descriptive").on('click', function(e) {
            var $itinerarySequence = $(this).data('event-id');
            currentEvent($itinerarySequence, $parishPolygons, $itineraryData, $locationMarkers);
        })

    }).fail(function( jqxhr, textStatus, error ) {
        var err = textStatus + ", " + error;
    });

    function currentEvent($itineraryIndex, $parishPolygons, $itineraryData, $locationMarkers) {

        // reset all polygons on each step
        $.each( $parishPolygons, function( $i, polygon) {
            polygon.polygon.setStyle({'color': polygon.color});
            polygon.polygon.closePopup();
            polygon.polygon.bindPopup( polygon.content );
        });
        $.each( $locationMarkers, function( $i, marker) {
            marker.marker.closePopup();
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
                    if (marker.latitude == $itineraryData[$itineraryIndex].location_latitude && marker.longitude == $itineraryData[$itineraryIndex].location_longitude) {
                        var $itineraryEventContent = '';
                        $itineraryEventContent = applyTemplate('pin-event', $itineraryData[$itineraryIndex].parish, $itineraryData[$itineraryIndex].content);
                        marker.marker.bindPopup( $itineraryEventContent );
                        marker.marker.openPopup();
                    }
                })

                $('.timeline-event span').removeClass('active');
                $('.timeline-event:nth-child('+($itineraryIndex+1)+') span').addClass('active');

                $.each( $parishPolygons, function( $i, polygon ) {
                    // Find the current parish polygon, light it up and change its content
                    if (polygon.id==$itineraryData[$itineraryIndex].parish_id) {
                        polygon.polygon.setStyle({'color': '#d31603'});
                        var $itineraryEventContent = '';
                        $itineraryEventContent = applyTemplate('pin-event', $itineraryData[$itineraryIndex].parish, $itineraryData[$itineraryIndex].content);
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
