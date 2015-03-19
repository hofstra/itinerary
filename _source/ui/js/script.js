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
    var baseMaps = {
        [modern_toggle_label]: map_mapbox,
        [historic_toggle_label]: map_historic
    };

    // Add the tile layer switcher control (toggler)
    L.control.layers(baseMaps).addTo(map);

    // Zoom and center in
    // TODO: Make this dynamic based on the map's contents
    map.setView([51.514, -0.0881481171],14);

    // TODO: Code for single location markers
    // var testMarker = L.marker([51.5133631072273, -0.0889500975608826]).addTo(map);
    // testMarker.bindPopup("This is <b>formatted</b> content about this location.").openPopup();

    $.getJSON( 'datajson/'+datajson, function (events) {
        var $itineraryData = events.events;
        $itineraryIndex = 0;

        // Let's put some parishes on the map!
        var $parishPolygons = new Array();

        $.getJSON( "datajson/parishes.json", function (parishes) {
            $.each( parishes.parishes, function(i, $parish) {
                var $vertices = [];
                var $parishPopUp = '';
                $.getJSON( "geojson/parish-"+$parish.id+".geojson", function (geodata) {
                    $.each(geodata.features, function(i, $feature) {
                        $vertices.push([ $feature.geometry.coordinates[1], $feature.geometry.coordinates[0] ]);
                    })

                    /*$parishPolygons[$parish.id] = {
                        'id' : $parish.id,
                        'polygon' : L.polygon([ $vertices ], { color: $parish.color }).addTo(map),
                        'color' : $parish.color
                    };*/
                    var $polygon = L.polygon([ $vertices ], { color: $parish.color }).addTo(map);
                    $parishPopUp =  '<div style="max-height: 175px; overflow-y: scroll;">';
                    $parishPopUp += "<h3>" + $parish.parish_name + "</h3>";
                    $parishPopUp += '</div>';
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
            currentEvent(0, $parishPolygons, $itineraryData);

        }).fail(function( jqxhr, textStatus, error ) {
            var err = textStatus + ", " + error;
            console.log( "Request Failed: " + err );
        })

        $('#stepper a:first-child').on('click', function(e) {
            e.preventDefault();
            if ( $itineraryIndex > 0) {
                $itineraryIndex--;
                currentEvent($itineraryIndex, $parishPolygons, $itineraryData);
            }
        });

        $('#stepper a:last-child').on('click', function(e) {
            e.preventDefault();
            if ( $itineraryIndex < $itineraryData.length) {
                $itineraryIndex++;
                currentEvent($itineraryIndex, $parishPolygons, $itineraryData);
            }
        });

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

    function currentEvent($itineraryIndex, $parishPolygons, $itineraryData) {

        // reset all polygons
        $.each( $parishPolygons, function( $i, polygon) {
            polygon.polygon.setStyle({'color': polygon.color});
            polygon.polygon.closePopup();
            polygon.polygon.bindPopup( polygon.content );
        });

        // Use fadeOut / fadeIn so it's clear we're stepping when the date and parish name might be the same as previous
        $('#stepper h2').fadeOut(function(){ $(this).text($itineraryData[$itineraryIndex].year).fadeIn() });
        $('#stepper p').fadeOut(
            function() {
                $(this).html(
                    $itineraryData[$itineraryIndex].date_descriptive + '<br />' + $itineraryData[$itineraryIndex].location_descriptive + $itineraryData[$itineraryIndex].parish
                ).fadeIn();
                $.each( $parishPolygons, function( $i, polygon) {
                    if (polygon.id==$itineraryData[$itineraryIndex].parish_id) {
                        polygon.polygon.setStyle({'color': '#d31603'});
                        var $itineraryEventContent = '';
                        $itineraryEventContent =  '<div style="max-height: 175px; overflow-y: scroll;">';
                        $itineraryEventContent += "<h3>" + $itineraryData[$itineraryIndex].parish + "</h3>";
                        $itineraryEventContent += '<p>';
                        $itineraryEventContent += $itineraryData[$itineraryIndex].date_descriptive + '<br />';
                        $itineraryEventContent += $itineraryData[$itineraryIndex].location_descriptive + '<br />';
                        $itineraryEventContent += '</p>';
                        $itineraryEventContent += '</div>';
                        polygon.polygon.bindPopup( $itineraryEventContent );
                        polygon.polygon.openPopup();
                    }
                });
            })
    }

    function getParish($parishPolygons, $parishId)
    {
        $.each( $parishPolygons, function( $i, polygon) {
            if (polygon.id==$parishId)
                return polygon;
        });
    }

})