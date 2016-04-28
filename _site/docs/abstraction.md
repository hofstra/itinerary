Note that this is supplemental to the current iteration of Itinerary's [how-to write-up](https://github.com/hofstra/itinerary/blob/master/docs/write-up.md).

### Resolved Items

* Jekyll & JavaScript-based rendering of Itinerary data, in tabular and interactive timeline formats respectively.
* Rendering of parishes, as referenced at the time of "A Plague Year." (Polygons)
* Rendering of single-location (lat & long) Itinerary events (entries). (Pins)
* Interlinking of parish and single-location timeline entries and map renderings.

### Open Items

* Genericizing parishes as regions, which may apply to parishes, neighborhoods, wards, counties, townships, or "fuzzy" location entries.
* Considering whether it would make sense to render broad references to streets as lines drawn on the map. (Lines)
* Moving map popup markup out of JavaScript and into JavaScript templates in the HTML context.
* Moving timeline structure/step content out of JavaScript and into JavaScript templates in the HTML context.
* Mapping desired Itinerary data fields to template markup.
* Enforcing required Itinerary data fields, and enabling mapping of fields where nomenclature may differ.

### Melville in Rome-inspired Items

* Route itineraries: Within the overall itinerary, we need to map individual points along a route. In the Melville example, these span multiple events (entries) on a single date, implying a common date field along with a common route field to link them together. These should presumably follow a line rendered on the map, while also allowing each point to be highlighted.
  * Melville indicates distances and cumulative distances. Straight lines connecting points on the rendered map will likely differ from these.
  * It may make sense to store these in a lookup table as we currently do for parishes/regions, so that they can appear at render time. Is this duplicative effort? Are there too many of these, compared to "static" shapes like parishes, to be useful until they're clicked on? Should they be labeled or feature core metadata common to all shared events?
* Melville has times and elapsed times for these route events. Could times impact sort order when rendered in the timeline? Note that timeline current relies on sequence rather than date for sorting, and will likely continue to, so this is a non-issue in that regard.
* The Melville Itinerary has literary comments as well as editorial notes. Similar to the disparate content fields in "A Plague Year," these will need to be mapped to templates for display.
* The Melville Itinerary identifies a companion, which would be displayed in the timeline as content and otherwise have no bearing on timeline or map rendering.
* The Melville Itinerary identifies weather, conveyance and observed sights, which would be displayed in the timeline as content and otherwise have no bearing on timeline or map rendering.

### Abstracting the Code

`currentEvent` is a JavaScript function that takes the following parameters:

* `itineraryIndex`: `currentEvent` will highlight the specified event in the timeline and "light it up" on the map, and is callable from any context: The prev/next step arrows, the event in the tabular data, etc. This is the index of the specified event in the Itinerary sequence, which will match the events loaded via JSON or Jekyll.
* `parishPolygons`: The array of polygons that were loaded and rendered at the onset, so we can light up the corresponding region. The reference should be changed to "Regions."
* `itineraryData`: The array of Itinerary events (entries) loaded from JSON.
* `locationMarkers`: The array of location markers loaded and rendered on the map at the onset. Note that only 1 pin will be rendered for each identically named location.

`currentEvent` does a few things:

1. Resets all polygons to their closed state and non-event content.
2. Resets all location markers to their closed state and (pending) non-event label.
3. Concatenates a string of HTML markup and content pulled from the Itinerary data before inserting that into the DOM.

Step 3 is what we need to abstract, as follows:

1. All markup within `currentEvent` needs to rely in [JavaScript templates], with placeholder fields that the code will rely on as hooks. This will allow an Itinerary developer to create a custom UI for their project, and be able to trust that code integration will remain intact.
2. Similarly, the bits of markup generated in code for the timeline nodes and "stepper" arrows need to reside in templates that can be loaded in code, so they can be tweaked in the layout wrapper.

Those two enhancements still assume that mapping unique fields to placeholders in the templates would require editing the JavaScript code **or** renaming those fields in future data files to match expectations in the code file. The latter would eliminate the ability to merge mutliple content fields into 1 output field. The former would break compatibility and the abiliyt to update a project's codebase as the core Itinerary project evolves.

This leaves *field mapping* as the final item to address.

### Field Mapping

The ability to map fields from Itinerary data to anticipated Itinerary code fields would likely reside in the Jekyll-driven JSON for the Itinerary data. We're currently loading data from 2 sources:

1. Compilation-time: Jekyll loads our project's CSV data into the tabular output of the wrapper page, which can be customized by the Itinerary developer for their project, and also into a JSON file.
2. Run-time: JavaScript loads the timeline and map renderings based on the JSON file generated at compilation time.

If we enforce a consistent format for the Itinerary JSON file, which is already generated by Jekyll, the Itinerary developer can map custom content field names into documented JSON field names **and** merge multiple fields together, along with markup as needed.

### Required steps to abstract the "Plague Year" application for general purposes:

1. Document required fields for code (such as `data-event-id` and `data-parish-id` in the tabular output, to link that with the timeline).
2. Rename all references to "parish" to "region".
3. Set DOM element class names and IDs to variables in the HTML wrapper's script block to refer to in code (rather than hard-coded selectors in jQuery).
4. Define timeline event markup as a template, and update code to fill that.
5. Define region and location marker popups, in their intial state, as templates, and update code to fill those.
6. Update `currentEvent` function to rely on templates, and to populate those.
7. Document required JSON fields for Itinerary data, region lookup table/data, and rendered tabular content.

### Additional Support for Melville in Rome

TBD.