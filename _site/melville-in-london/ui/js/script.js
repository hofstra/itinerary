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
    (group[item[key]] = group[item[key]] || []).push(item);
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

  $.getJSON("https://mel-catalog-staging.herokuapp.com/api/itineraries/8", function(data) {
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

    baseMaps['London today'] = L.tileLayer(tile_template_mapbox, {attribution: attribution_mapbox});

    var map = L.map('map-container', {layers: baseMaps['London 1849 - Post Office']});

    // Setting the map interaction defaults. I find that when using a map that fills the page, allowing zoom based on scroll wheel, which is also used to scroll up and down the page, is problematic.
    map.dragging.enable();
    map.touchZoom.disable();
    map.doubleClickZoom.enable();
    map.scrollWheelZoom.disable();

    // Add the tile layer switcher control (toggler)
    L.control.layers(baseMaps).addTo(map);

    var map_center = [51.5079242, -0.096461];
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
    columns["nn notes"] = "NN Editorial Note"
    columns.editorial = "WK Editorial Note";
    tableHeaderMarkup = "<thead><tr>";
    for (var key in columns) {
      if (columns.hasOwnProperty(key)) {
        tableHeaderMarkup += "<th>" + columns[key] + "</th>";
      }
    }
    tableHeaderMarkup += "</tr></thead>";

    var stepMarkers = {};
    var pathMarkers = {};
    var tempShownLayer;

    var grouped = groupBy(data.itinerary_steps, groupBasis);
    for (var unit in grouped) {
      if (grouped.hasOwnProperty(unit)) {
        var headerMarkup = "<h3>Day " + unit + "</h3>";
        var tableMarkup = "<table>" + tableHeaderMarkup + "<tbody>";

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
          geo._waypoint = step.waypoint;
          geo._stepId = step.id;
          geo._route = step.route;
          return geo;
        }), {
          onEachFeature: function(feature, layer) {
            var stepMarkup = applyTemplate("pin-name", feature._waypoint, "");
            layer.bindPopup(stepMarkup);
            stepMarkers[unit][feature._index] = {
              "id": feature._stepId,
              "marker": layer,
              "waypoint": feature._waypoint,
              "latitude": layer.getLatLng()[0],
              "longitude": layer.getLatLng()[1],
              "route": feature._route
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
              tableMarkup += (item[key] === null? "" : item[key]);
            tableMarkup += "</td>"
          }
          tableMarkup += "</tr>";
        });
        tableMarkup += "</tbody></table>"
        $("#data-container").append(headerMarkup + tableMarkup);
      }
    }

    $("#path-nav").append("<br style='clear:both;'>");

    L.geoJson(data.itinerary_paths.map(function(path, index) {
      var geo = path.geo_object;
      geo._index = index;
      geo._color = colors[index];
      geo._unit = path.group;
      geo._text = path.text;
      geo._primacy = path.primacy;
      return geo;
    }), {
      style: function(feature) {
        return {color: feature._color, opacity: 0.5};
      },
      onEachFeature: function(feature, layer) {
        var stepMarkup = applyTemplate("pin-name", feature._text, "");
        layer.bindPopup(stepMarkup);
        layer._primacy = feature._primacy;
        pathMarkers[feature._unit][feature._index] = layer;
      }
    });

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
    });

    function clearTempShownLayer() {
      if (tempShownLayer)
        map.removeLayer(tempShownLayer);
      tempShownLayer = null;
    }

    $(".day-nav-header").first().click();
  });
});
