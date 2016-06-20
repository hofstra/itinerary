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

    map.on('click', function(e) {
        $.each( $paths, function( $i, path) {
            path.path.closePopup();
            if (path.path.opacity > 0) {
                path.path.clickable = true;
                path.path.setStyle({ weight: 8, opacity: .5 });
            }
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

    $.getJSON( "datajson/paths.json", function (paths) {
        $.each( paths.paths, function(i, $path) {
            $.getJSON( 'geojson/path-'+$path.route+'-'+$path.event+'-'+$path.id+'.geojson', function (geodata) {
                var $vertices = [];
                $.each(geodata.features, function(i, $feature) {
                    $.each($feature.geometry['coordinates'], function(i, $coordinates) {
                        $vertices.push([ $coordinates[1], $coordinates[0] ]);
                    })
                })
                var $pathLine = L.polyline($vertices).addTo(map);

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
                $popup = applyTemplate('pin-name', $path.content, '');
                $pathLine.bindPopup($popup);
                $pathLine.on( 'click', function(e) {
                    $.each( $paths, function( $i, path ) {
                        if (path.path.opacity > 0) {
                            path.path.clickable = true;
                            path.path.setStyle({ weight: 8, opacity: .5 });
                        }
                    })
                    $pathLine.setStyle({ weight: 3, opacity: 1.0 });

                })
                $pathLine.on( 'popupclose', function(e) {
                    $pathLine.setStyle({ weight: 8, opacity: .5 });
                })
            }).fail(function( jqxhr, textStatus, error ) {
                var err = textStatus + ", " + error;
            });
        })
        $.each( $paths, function( $i, path) {
            path.path.on('click', function(e) {
                $.each( $waypointMarkers, function( $i, marker) {
                    $popup = applyTemplate('pin-name', marker.waypoint, '');
                    marker.marker.bindPopup($popup);
                });
                $popup = applyTemplate('pin-name', path.content, '');
                path.path.bindPopup($popup);
                path.path.openPopup;
            })
        });
    }).fail(function( jqxhr, textStatus, error ) {
        var err = textStatus + ", " + error;
    });

    var $waypointId = 1;
    var $waypointMarkers = new Array();;
    $.getJSON( 'datajson/'+datajson, function (events) {
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
                        'longitude' : $event.longitude,
                        'route' : $event.route
                    }
                )
                $waypointId++;

                $itineraryEventContent = applyTemplate('pin-name', $event.waypoint, '');
                $marker.bindPopup( $itineraryEventContent );

            }
        })
        $.each( $waypointMarkers, function( $i, marker) {
            marker.marker.on('click', function(e) {
                $.each( $waypointMarkers, function( $i, marker) {
                    $popup = applyTemplate('pin-name', $event.waypoint, '');
                    marker.marker.bindPopup($popup);
                });
                $popup = applyTemplate('pin-name', marker.waypoint, '');
                marker.marker.bindPopup($popup);
                marker.marker.openPopup;
                $.each( $paths, function( $i, path) {
                    path.path.closePopup();
                    if (path.path.opacity > 0) {
                        path.path.clickable = true;
                        path.path.setStyle({ weight: 8, opacity: .5 });
                    }
                })
            })
        });
    }).fail(function( jqxhr, textStatus, error ) {
        var err = textStatus + ", " + error;
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
                if ( (path.route == $checkbox.data('route')) && (path.primary == $checkbox.data('primary')) )
                {
                    path.path.closePopup();
                    path.path.clickable = true;
                    path.path.setStyle({ weight: 8, opacity: .5 });
                }
            })
        }
        else {
            console.log("unchecked");
            $.each( $paths, function( $i, path) {
                if ( (path.route == $checkbox.data('route')) && (path.primary == $checkbox.data('primary')) )
                {
                    path.path.closePopup();
                    path.path.clickable = false;
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
            if (path.path.opacity > 0) {
                path.path.clickable = true;
                path.path.setStyle({ weight: 8, opacity: .5 });
            }
        })
        $.each( $waypointMarkers, function( $i, marker) {
            marker.marker.closePopup();
            $popup = applyTemplate('pin-name', marker.waypoint, '');
            marker.marker.bindPopup($popup);
        });
        $.each( $paths, function( $i, path) {
            if ( (path.id == $pathId) && (path.event == $pathEventId) )
            {
                $popup = applyTemplate('pin-name', $pathName, '');

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
            if (path.path.opacity > 0) {
                path.path.clickable = true;
                path.path.setStyle({ weight: 8, opacity: .5 });
            }
        })
        $.each( $waypointMarkers, function( $i, marker) {
            marker.marker.closePopup();
            $popup = applyTemplate('pin-name', marker.waypoint, '');
            marker.marker.bindPopup($popup);
        });
        $.each( $waypointMarkers, function( $i, marker ) {
            if ($i+1 == $waypointId)
            {
                $itemContent = '';
                $.each( $('tr.'+$waypoint), function( $i, tr ) {
                    // All of the following should be the itemContent for events that match the waypoint.
                    // In this case there *is* markup in the JS because the itinerary table is the interface for this data.
                    // ...It's where the entries are grouped by waypoint-id.
                    if ( $(tr).children('td.date').html().length > 0 )
                        $itemContent += '<p><b>' + $(tr).children('td.date').html() + '</b></p>';
                    if ( $(tr).children('td.location').html().length > 0 )
                        $itemContent += '<p>' + $(tr).children('td.location').html() + '</p>';
                    if ( $(tr).children('td.observation').html().length > 0 )
                        $itemContent += '<p><i>' + $(tr).children('td.observation').html() + '</i></p>';
                    if ( $(tr).children('td.text').html().length > 0 )
                        $itemContent += '<p><i>' + $(tr).children('td.text').html() + '</i></p>';
                } )
                $popup = applyTemplate('pin-waypoint', $waypointName, $itemContent);
                marker.marker.bindPopup($popup);
                marker.marker.openPopup();
            }
        })
    })
})
