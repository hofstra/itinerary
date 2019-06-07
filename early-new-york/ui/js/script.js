var groupBasis = "group"; // this should eventually be an option defined in the Itinerary
var excludeFromTable = ["step_type", "alt_route", "nn notes"]; // ditto

function applyTemplate($templateName, $itemName, $itemContent)
{
    $template = $('.js-templates .'+$templateName).html();
    $template = $template.replace('[% itemName %]', $itemName).replace('[% itemContent %]', $itemContent);
    return $template;
}

function groupBy(array, key) {
  return array.reduce(function(group, item) {
    var unit = item[key] || "other";
    (group[unit] = group[unit] || []).push(item);
    return group;
  }, {});
}

$(document).ready(function() {
  // replace with d3 color scale?
  var colors = [
    "#1438bd",
    "#e9b829",
    "#900503",
    "#fb6b02",
    "#038911",
    "#281e5d",
    "#f9a602",
    "#d31603",
    "#893201",
    "#74b62d",
    "#85144b",
    "#141e3c",
    "#311431"
  ];

  $.getJSON("http://catalog.textlab.org/api/itineraries/16", function(data) {
    var tile_template_mapbox = 'https://api.mapbox.com/styles/v1/mapbox/streets-v10/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoicGVyZm9ybWFudHNvZnR3YXJlIiwiYSI6ImNpeTRyN29qMzAwM3YycHNhOGlzdTd1YW8ifQ.RsLW5SB08l3biddzglEa5A';
    var attribution_mapbox = 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, Imagery © <a href="http://mapbox.com">Mapbox</a>';

    var baseMaps = {};
    data.maps.forEach(function(map) {
      // assumes MapWarper url convention
      var tile_template = map.georectified_resource_uri;
      tile_template = tile_template.replace("/maps/", "/maps/tile/");
      tile_template = tile_template + "/{z}/{x}/{y}.png";
      baseMaps[map.title] = L.tileLayer(tile_template);
    });

    baseMaps['Manhattan Today'] = L.tileLayer(tile_template_mapbox, {attribution: attribution_mapbox});

    var map = L.map('map-container', {layers: baseMaps['1839 Bradford Map of New York City']});

    // Setting the map interaction defaults. I find that when using a map that fills the page, allowing zoom based on scroll wheel, which is also used to scroll up and down the page, is problematic.
    map.dragging.enable();
    map.touchZoom.disable();
    map.doubleClickZoom.enable();
    map.scrollWheelZoom.disable();

    // Add the tile layer switcher control (toggler)
    L.control.layers(baseMaps).addTo(map);

    var map_center = [40.7069, -74.0031];
    var map_zoom = 15;
    map.setView(map_center, map_zoom);

    var columns = {
      display_date: "Date"
    }
    $.each(data.steps_custom_field_keys, function(i, key) {
      if (key != groupBasis && excludeFromTable.includes(key) === false) {
        var prettyKey = key.replace("_", " ");
        prettyKey = prettyKey.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
        columns[key] = prettyKey;
      }
    });
    columns.text = "HM Comment";
    columns["nn notes"] = "TA Editorial Note"
    columns.editorial = "TA Editorial Note";
    tableHeaderMarkup = "<thead><tr>";
    for (var key in columns) {
      if (columns.hasOwnProperty(key)) {
        tableHeaderMarkup += "<th data-key='" + key + "'>" + columns[key] + "</th>";
      }
    }
    tableHeaderMarkup += "</tr></thead>";

    var stepMarkers = {};
    var pathMarkers = {};
    var tempShownLayer;

    var imageViewer;
    var imageTileSources = [];
    var stepTileSourceTable = {};
    var pathTileSourceTable = {};
    var tileSourceMarkerTable = {};
    var ignorePageEvent = false;

    var grouped = groupBy(data.itinerary_steps, groupBasis);
    for (var unit in grouped) {
      if (grouped.hasOwnProperty(unit)) {
        var headerMarkup = "<h3>Day " + unit + "</h3>";
        var tableMarkup = "<table id='table-for-group-" + unit + "'>" + tableHeaderMarkup + "<tbody>";

        stepMarkers[unit] = {};
        pathMarkers[unit] = {};

        var navMarkup = "<td class='day'><h3 class='day-nav-header'>" + unit + "</h3><ul>";
        $.each([{primacy: 1, label: "Primary route"}, {primacy: 0, label: "Alternate routes"}], function(i, option) {
          // navMarkup += "<li><label><input class='path-toggle' type='checkbox' data-route='" + unit + "' data-primary='" + option.primacy + "'>" + option.label + "</label></li>";
          navMarkup += "<li><input class='path-toggle' type='checkbox' data-route='" + unit + "' data-primary='" + option.primacy + "'></li>";
        });
        navMarkup += "</ul></td>";
        $("#path-nav-row").append(navMarkup);

        L.geoJson(grouped[unit].map(function(step, index) {
          var geo = step.geo_object;
          geo._index = index;
          geo._waypoint = step.waypoint || "";
          geo._stepId = step.id;
          geo._group = step.group;
          return geo;
        }), {
          onEachFeature: function(feature, layer) {
            var stepMarkup = applyTemplate("pin-name", "Day " + feature._group + " — Waypoint " + (feature._index + 1) + (feature._waypoint.length > 0 ? "<br /><br />" + feature._waypoint : ""), "");
            layer.bindPopup(stepMarkup);
            stepMarkers[unit][feature._index] = {
              "id": feature._stepId,
              "marker": layer,
              "waypoint": feature._waypoint,
              "latitude": layer.getLatLng()[0],
              "longitude": layer.getLatLng()[1],
              "route": feature._group
            };
          }
        });

        $.each(grouped[unit], function(i, item) {
          tableMarkup += "<tr>";
          for (var key in columns) {
            tableMarkup += "<td>";
            if ((key === "waypoint" || key === "display_location") && stepMarkers[unit][i])
              tableMarkup += "<a class='waypoint-link' data-unit='" + unit + "' data-index='" + i + "' href='#map-container'>"  + (item[key] === null? "[See map]" : item[key]) + "</a>";
            else
              tableMarkup += (item[key] === null ? "" : item[key]);
            if (key === "waypoint" || key === "display_location") {
              if (item.attachments.length > 0) {
                tableMarkup += "<br />";
                var firstImage = true;
                var existing = false;
                $.each(item.attachments, function(j, attachment) {
                  var tileSourceIndex = imageTileSources.length;
                  if (attachment.iiif_uri) {
                    var sourceString = attachment.iiif_uri + "/info.json";
                    $.each(imageTileSources, function(k, tileSource) {
                      if (tileSource == sourceString) {
                        tileSourceIndex = k;
                        existing = true;
                      }
                    });
                    if (!existing)
                      imageTileSources.push(sourceString);
                  }
                  else if (attachment.image_url) {
                    $.each(imageTileSources, function(k, tileSource) {
                      if (typeof tileSource === "object" && tileSource.url == attachment.image_url) {
                        tileSourceIndex = k;
                        existing = true;
                      }
                    });
                    if (!existing) {
                      imageTileSources.push({
                        type: "image",
                        url: attachment.image_url
                      });
                    }
                  }
                  else {
                    return true; // don't add a link without tilesource
                  }
                  if (firstImage) {
                    stepTileSourceTable[unit] = stepTileSourceTable[unit] || {}
                    stepTileSourceTable[unit][i] = tileSourceIndex;
                    firstImage = false;
                  }
                  if (!existing) {
                    tileSourceMarkerTable[tileSourceIndex] = stepMarkers[unit][i];
                  }
                  var imageLinkMarkup = "<a class='image-link' href='#image-viewer' data-tilesource-index='" + (tileSourceIndex) + "'><img src='/itinerary/ui/img/camera.png' /></a>";
                  tableMarkup += imageLinkMarkup;
                  if (stepMarkers[unit][i] && stepMarkers[unit][i].marker) {
                    var popup = stepMarkers[unit][i].marker.getPopup();
                    popup.setContent(popup.getContent() + imageLinkMarkup);
                  }
                });
              }
            }
            tableMarkup += "</td>"
          }
          tableMarkup += "</tr>";
        });
        tableMarkup += "</tbody></table>"
        $("#data-container").append(headerMarkup + tableMarkup);
      }
    }

    grouped = groupBy(data.itinerary_paths, groupBasis);
    var index = 0;
    for (var unit in grouped) {
      if (grouped.hasOwnProperty(unit)) {
        var $table = $("#table-for-group-" + unit);
        var columnCount = $table.find("thead th").length;
        var waypointIndex = $table.find("thead th").index($table.find("thead th[data-key='waypoint']"));
        var editorialIndex = $table.find("thead th").index($table.find("thead th[data-key='editorial']"));
        $.each(grouped[unit], function(i, item) {
          var rowMarkup = "<tr>";
          for (var j = 0; j < columnCount; j++) {
            rowMarkup += "<td>";
            if (j == 0)
              rowMarkup += '<img src="/itinerary/ui/img/path.png" style="width: 80px; height: auto;" />';
            if (j == waypointIndex) {
              rowMarkup += "<a class='route-link' data-unit='" + unit + "' data-index='" + index + "' data-primary='" + (item.primacy == 1 ? "1" : "0") + "' href='#map-container'>";
              if (item.hasOwnProperty("primacy") && item.primacy > 1)
                rowMarkup += "Alternate route";
              else
                rowMarkup += "Primary route";
              rowMarkup += "</a>";
              if (item.attachments.length > 0) {
                rowMarkup += "<br />";
                var firstImage = true;
                var existing = false;
                $.each(item.attachments, function(j, attachment) {
                  var tileSourceIndex = imageTileSources.length;
                  if (attachment.iiif_uri) {
                    var sourceString = attachment.iiif_uri + "/info.json";
                    $.each(imageTileSources, function(k, tileSource) {
                      if (tileSource == sourceString) {
                        tileSourceIndex = k;
                        existing = true;
                      }
                    });
                    if (!existing)
                      imageTileSources.push(sourceString);
                  }
                  else if (attachment.image_url) {
                    $.each(imageTileSources, function(k, tileSource) {
                      if (typeof tileSource === "object" && tileSource.url == attachment.image_url) {
                        tileSourceIndex = k;
                        existing = true;
                      }
                    });
                    if (!existing) {
                      imageTileSources.push({
                        type: "image",
                        url: attachment.image_url
                      });
                    }
                  }
                  else {
                    return true; // don't add a link without tilesource
                  }
                  if (firstImage) {
                    pathTileSourceTable[unit] = pathTileSourceTable[unit] || {}
                    pathTileSourceTable[unit][i] = tileSourceIndex;
                    firstImage = false;
                  }
                  if (!existing) {
                    tileSourceMarkerTable[tileSourceIndex] = pathMarkers[unit][i];
                  }
                  var imageLinkMarkup = "<a class='image-link' href='#image-viewer' data-tilesource-index='" + (tileSourceIndex) + "'><img src='/itinerary/ui/img/camera.png' /></a>";
                  rowMarkup += imageLinkMarkup;
                  if (pathMarkers[unit][i]) {
                    var popup = pathMarkers[unit][i].getPopup();
                    popup.setContent(popup.getContent() + imageLinkMarkup);
                  }
                });
              }
            }
            if (j == editorialIndex && item.hasOwnProperty("editorial"))
              rowMarkup += item.editorial;
            rowMarkup += "</td>";
          }
          rowMarkup += "</tr>";
          $("#table-for-group-" + unit).append(rowMarkup);
          index ++;
        });
      }
    }

    $("#path-nav").append("<br style='clear:both;'>");

    L.geoJson(data.itinerary_paths.map(function(path, index) {
      var geo = path.geo_object;
      geo._index = index;
      geo._color = colors[index % colors.length];
      geo._unit = path.group;
      geo._text = path.editorial || "";
      if (geo._text.length == 0) geo._text = geo.text || "";
      geo._primacy = path.primacy;
      return geo;
    }), {
      style: function(feature) {
        return {color: feature._color, opacity: 0.5};
      },
      onEachFeature: function(feature, layer) {
        var stepMarkup = applyTemplate("pin-name", "Day " + feature._unit + " — " + (feature._primacy == 1 ? "Primary Route" : "Alternate Route") + (feature._text.length > 0 ? "<br /><br />" + feature._text : ""), "");
        layer.bindPopup(stepMarkup);
        layer._primacy = feature._primacy;
        pathMarkers[feature._unit][feature._index] = layer;
      }
    });

    $(".row-scroll-right a").click(function(event) {
      event.preventDefault();
      $(this).closest("#path-nav-table-holder").animate({
        scrollLeft: "+=300"
      }, 500);
    });

    $(".row-scroll-left a").click(function(event) {
      event.preventDefault();
      $(this).closest("#path-nav-table-holder").animate({
        scrollLeft: "-=300"
      }, 500);
    });

    $("#path-nav-table-holder").scroll(function(event) {
      if ($(this).scrollLeft() + $(this).width() + 105 >= $(this).find("table").width())
        $(this).find(".row-scroll-right").fadeOut();
      else
        $(this).find(".row-scroll-right").fadeIn();
      if ($(this).scrollLeft() < 30)
        $(this).find(".row-scroll-left").fadeOut();
      else {
        $(this).find(".row-scroll-left").fadeIn();
      }
    });

    $("#path-nav-table-holder").scroll();

    $(".day .day-nav-header").click(function(event) {
      var $navGroup = $(this).closest(".day");
      $(".path-toggle").prop("checked", false);
      $navGroup.find(".path-toggle").prop("checked", true);
      $(".path-toggle").trigger("change");
    });

    $(".path-toggle").on('change', function(e) {
      clearTempShownLayer();
      $checkbox = $(this);
      var primary = $(this).data("primary");
      if ($(this).prop('checked')) {
        for (var i in pathMarkers[$(this).data("route")]) {
          var pathMarker = pathMarkers[$(this).data("route")][i];
          if (primary == 1 && pathMarker._primacy == 1) {
            pathMarker.addTo(map);
          }
          else if (primary == 0 && pathMarker._primacy > 1) {
            pathMarker.addTo(map);
          }
        }
        for (var i in stepMarkers[$(this).data("route")]) {
          var stepMarker = stepMarkers[$(this).data("route")][i];
          if (stepMarker && stepMarker.marker)
            stepMarker.marker.addTo(map);
        }
      }
      else {
        for (var i in pathMarkers[$(this).data("route")]) {
          var pathMarker = pathMarkers[$(this).data("route")][i];
          if (primary == 1 && pathMarker._primacy == 1) {
            map.removeLayer(pathMarker);
          }
          else if (primary == 0 && pathMarker._primacy > 1) {
            map.removeLayer(pathMarker);
          }
        }
        var anyChecked = false;
        $(this).closest(".day").find(".path-toggle").each(function() {
          if ($(this).prop("checked")) {
            anyChecked = true;
            return false;
          }
        });
        if (!anyChecked) {
          for (var i in stepMarkers[$(this).data("route")]) {
            var stepMarker = stepMarkers[$(this).data("route")][i];
            if (stepMarker && stepMarker.marker)
              map.removeLayer(stepMarker.marker);
          }
        }
      }
    });

    $(".waypoint-link").click(function() {
      clearTempShownLayer();
      var unit = $(this).data("unit");
      var index = $(this).data("index");
      var stepMarker = stepMarkers[unit][index];
      if (stepMarker && stepMarker.marker) {
        stepMarker.marker.addTo(map);
        stepMarker.marker.openPopup();
        map.panTo(stepMarker.marker.getLatLng());
        tempShownLayer = stepMarker.marker;
      }
      ignorePageEvent = true;
      if (stepTileSourceTable[unit] && stepTileSourceTable[unit].hasOwnProperty(index)) {
        imageViewer.goToPage(stepTileSourceTable[unit][index]);
      }
    });

    $(".route-link").click(function() {
      clearTempShownLayer();
      var unit = $(this).data("unit");
      var index = $(this).data("index");
      var primary = $(this).data("primary");
      var pathMarker = pathMarkers[unit][index];
      $(".path-toggle[data-route='" + unit + "'][data-primary='" + primary + "']").prop("checked", true).change();
      if (pathMarker) {
        pathMarker.openPopup();
      }
    });

    function clearTempShownLayer() {
      if (tempShownLayer)
        map.removeLayer(tempShownLayer);
      tempShownLayer = null;
    }

    imageViewer = OpenSeadragon({
      id: "image-viewer",
      prefixUrl: "/itinerary/ui/openseadragon/images/",
      sequenceMode: true,
      showReferenceStrip: true,
      gestureSettingsMouse: {
        scrollToZoom: false
      },
      tileSources: imageTileSources
    });

    $(document).on("click", ".image-link", function(event) {
      $("#image-viewer").show();
      map.invalidateSize();
      var index = $(event.target).closest(".image-link").data("tilesource-index");
      if (index) {
        ignorePageEvent = true;
        imageViewer.goToPage(index);
      }
    });

    imageViewer.addHandler("page", function(event) {
      if (!ignorePageEvent) {
        clearTempShownLayer();
        var marker = tileSourceMarkerTable[event.page];
        if (marker && marker.marker) {
          marker.marker.addTo(map);
          marker.marker.openPopup();
          map.panTo(marker.marker.getLatLng());
          tempShownLayer = marker.marker;
        }
      }
      ignorePageEvent = false;
    });

    $(".hide-image-viewer").click(function(event) {
      event.preventDefault();
      $("#image-viewer").hide();
      map.invalidateSize();
    });

    $("#image-viewer").hide();
    map.invalidateSize();
    $(".day .day-nav-header").first().click();
  });
});
