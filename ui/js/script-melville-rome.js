function applyTemplate($templateName, $itemName, $itemContent)
{
    $template = $('.js-templates .'+$templateName).html();
    return $template;
}

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

    map.on('click', function(e) {
        $.each( $paths, function( $i, path) {
            path.path.closePopup();
            path.path.setStyle({ weight: 8, opacity: .5 });
        })
    })

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
    $colors.push('#85144b');
    $colors.push('#141e3c');
    $colors.push('#311431');

    var $paths = new Array();

    $.getJSON( "/itinerary/datajson/paths.json", function (paths) {
        $.each( paths.paths, function(i, $path) {
            $.getJSON( '/itinerary/geojson/path-'+$path.route+'-'+$path.event+'-'+$path.id+'.geojson', function (geodata) {
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

                if ($path.primary == '1')
                    $pathLine.setStyle({color: $colors[i%13], weight: 8, opacity: 0.5});
                else
                    $pathLine.setStyle({color: '#4b371c', weight: 8, opacity: 0.5});

                $paths.push(
                    {
                        'id' : $path.id,
                        'event' : $path.event,
                        'path' : $pathLine,
                        'content' : $path.content,
                        'route' : $path.route,
                        'primary' : $path.primary
                    }
                );
                $pathLine.bindPopup('<h3>' + $path.content + '</h3>');
                $pathLine.on( 'click', function(e) {
                    $.each( $paths, function( $i, path ) {
                        path.path.setStyle({ weight: 8, opacity: .5 });
                    })
                    $pathLine.setStyle({ weight: 3, opacity: 1.0 });
                })
                $pathLine.on( 'popupclose', function(e) {
                    $pathLine.setStyle({ weight: 8, opacity: .5 });
                })
            }).fail(function( jqxhr, textStatus, error ) {
                var err = textStatus + ", " + error;
                //console.log( "Request Failed: " + err );
            });
        })
        $.each( $paths, function( $i, path) {
            path.path.on('click', function(e) {
                $.each( $waypointMarkers, function( $i, marker) {
                    // This needs to go in a template.
                    marker.marker.bindPopup('<h3>' + marker.waypoint + '</h3>');
                });
                // This needs to go in a template.
                path.path.bindPopup('<h3>' + path.content + '</h3>');
                path.path.openPopup;
            })
        });
    }).fail(function( jqxhr, textStatus, error ) {
        var err = textStatus + ", " + error;
        //console.log( "Request Failed: " + err );
    });

    var $waypointId = 1;
    var $waypointMarkers = new Array();;
    $.getJSON( '/itinerary/datajson/'+datajson, function (events) {
        var $itineraryData = events.events;
        // Loop through events
        $.each ($itineraryData, function(i, $event) {

            // Let's put locations on the map!

            if ( $event.latitude != '' && $event.longitude != '' && $event.type == 'w' )
            {

                var $marker = L.marker([$event.latitude, $event.longitude]).addTo(map);

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
                //console.log(applyTemplate('pin-name', '', ''));
                $itineraryEventContent = '<h3>' + $event.waypoint + '</h3>';
                $marker.bindPopup( $itineraryEventContent );

            }
        })
        $.each( $waypointMarkers, function( $i, marker) {
            marker.marker.on('click', function(e) {
                $.each( $waypointMarkers, function( $i, marker) {
                    // This needs to go in a template.
                    marker.marker.bindPopup('<h3>' + marker.waypoint + '</h3>');
                });
                // This needs to go in a template.
                marker.marker.bindPopup('<h3>' + marker.waypoint + '</h3>');
                marker.marker.openPopup;
                $.each( $paths, function( $i, path) {
                    path.path.closePopup();
                    path.path.setStyle({ weight: 8, opacity: .5 });
                })
            })
        });
    }).fail(function( jqxhr, textStatus, error ) {
        var err = textStatus + ", " + error;
        //console.log( "Request Failed: " + err );
    })

    $(window).on('resize', function(e) {
        $('tr.path-primary').children('td').css('display','none');
        $('tr.path-alternate').children('td').css('display','none');
        $("td.toggle span").html('[ + ]')
    })

    $(".path-toggle").prop('checked', true);
    $(".path-toggle").on('click', function(e) {
        $checkbox = $(this);
        if ($(this).prop('checked')) {
            console.log("checked");
            $.each( $paths, function( $i, path) {
                /*console.log(path.route + ' ' + path.primary);
                console.log($checkbox.data('route') + ' ' + $checkbox.data('primary')); */
                if ( (path.route == $checkbox.data('route')) && (path.primary == $checkbox.data('primary')) )
                {
                    path.path.closePopup();
                    path.path.setStyle({ weight: 8, opacity: .5 });
                }
            })
        }
        else {
            console.log("unchecked");
            $.each( $paths, function( $i, path) {
                /*console.log(path.route + ' ' + path.primary);
                console.log($checkbox.data('route') + ' ' + $checkbox.data('primary')); */
                if ( (path.route == $checkbox.data('route')) && (path.primary == $checkbox.data('primary')) )
                {
                    console.log(path.path);
                    path.path.closePopup();
                    path.path.setStyle({ weight: 8, opacity: 0 });
                }
            })
        }
    })

    $("td.toggle span").on('click', function(e) {
        if ( $(this).html() == '[ + ]' )
        {
            $(this).html('[ - ]');
            $(this).parent('td').parent('tr').parent('tbody').children('tr.path-primary').children('td').css('display','table-cell');
            $(this).parent('td').parent('tr').parent('tbody').children('tr.path-alternate').children('td').css('display','table-cell');
        }
        else
        {
            $(this).html('[ + ]');
            $(this).parent('td').parent('tr').parent('tbody').children('tr.path-primary').children('td').css('display','none');
            $(this).parent('td').parent('tr').parent('tbody').children('tr.path-alternate').children('td').css('display','none');
        }
    })

    $(".path a").on('click', function(e) {
        //e.preventDefault(); // Let the # link scroll us to the top
        var $path = $(this).data('path-id');
        var $pathName = $(this).html();
        var $pathEventId = $(this).data('path-id').split('-')[1];
        var $pathId = $(this).data('path-id').split('-')[2];

        $.each( $paths, function( $i, path) {
            path.path.closePopup();
            path.path.setStyle({ weight: 8, opacity: .5 });
        })
        $.each( $waypointMarkers, function( $i, marker) {
            marker.marker.closePopup();
            // This needs to go in a template.
            marker.marker.bindPopup('<h3>' + marker.waypoint + '</h3>');
        });
        $.each( $paths, function( $i, path) {
            if ( (path.id == $pathId) && (path.event == $pathEventId) )
            {
                // This needs to go in a template
                $popup = '<div style="max-height: 175px; overflow-y: scroll;">';
                // This should be the itemName field in a template.
                $popup += '<h3>' + $pathName + '</h3>';
                // This needs to go in a template.
                $popup += '</div>';
                path.path.setStyle({ weight: 3, opacity: 1.0 });
                path.path.bindPopup($popup);
                path.path.openPopup();
            }
        })
    })

    $(".waypoint a").on('click', function(e) {
        //e.preventDefault(); // Let the # link scroll us to the top
        var $waypoint = $(this).data('waypoint-id');
        var $waypointName = $(this).html();
        var $waypointId = $(this).data('waypoint-id').split('-')[1];
        var $itinerarySequence = $(this).data('waypoint-id');

        $.each( $paths, function( $i, path) {
            path.path.closePopup();
            path.path.setStyle({ weight: 8, opacity: .5 });
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
                // This should be the itemName field in a template.
                $popup += '<h3>' + $waypointName + '</h3>';
                $.each( $('tr.'+$waypoint), function( $i, tr ) {
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
