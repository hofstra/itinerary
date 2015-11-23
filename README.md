# Itinerary

## Phase 2 Project Notes

I've been considering ways to support interactivity and crowdsourcing, and how we might implement a model for accepting community input on routes and alt routes.

At this time, I'm choosing to stick with CSV files as our data model, which can be consumed directly in Jekyll to generate JSON for JavaScript processing **and** HTML for in-page content. This is important from an accessibility perspective. I am wary of any solution that would only function via a JavaScript solution, and the implications for accessibility.

For example:

* Storing itinerary/route data in Google Docs spreadsheets: While this can be consumed as CSV data, there is no way to do so in Jekyll. We would be required to do so at run-time with JavaScript, or switch to a PHP backend to parse and present data. While Google Docs would support concurrent/community editing, it would have all members editing one live, master version.
* PHP/database backend: I think, whether as a bespoke PHP application or based on a CMS or framework, this implies more scope than is currently supported. However, our current efforts to model data records for itinerary events and routes should be undertaken with this goal in mind.
