# Itinerary

[Visit the website to learn more about Itinerary](http://itinerary.hofstradrc.org).

## Current State

Thus far our efforts have served to produce two working demonstrations using mapping technology to navigate historical data or literature:

* "[Plague Year](http://hofstra.github.io/itinerary/plague-year/)," which provides a timeline-based navigation tool to step through events recorded from Defoe's *A Journal of the Plague Year*.
* [Melville in Rome](http://hofstra.github.io/itinerary/melville-in-rome/), which enables the exploration of possible routes taken by Melville in between events recorded in his journal of his time spent there.

The project uses widely-embraced and familiar technologies and we encourage others to fork this codebase and render their own maps using their own data.

## Feedback

We invite and encourage your feedback to make Itinerary better! Please use [GitHub Issues](https://github.com/hofstra/itinerary/issues) to provide feedback.

## Going Forward

Our next phase of development will focus on better realizing the UI layer as a portable JavaScript application that can sit atop any backend technology, as long as the data to be consumed conforms to the prescribed JSON spec. This will enable other projects to add a mapping UI layer to existing applications, or to work with their preferred technologies. We will have further explored *event*, *route*, *path*, and *region* concepts such that those can be universally adapted to different data and geographies. We will look to provide template examples for outputting data from other platforms.

Also important in our next phase will be addressing the need for unique, persistent URIs for *events*, which is our term for entries in the itinerary. As the current phase uses Jekyll to spin up a static site based on the current state of the data (in CSV format) and JavaScript to pull together that data at run-time, there is no persistent data store for itinerary entries so that those can be reliably linked to or referenced by unique identifiers. Thus it is not presently possible to reference one event in another event's notes, which is a stated goal.

As Itinerary evolves, our goal is to enable collaborative and crowdsourcing features so that scholarly communities can share insight and help refine mapped data.
