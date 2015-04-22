The goal of the Itinerary project, with source data found in Daniel Defoe's *A Journal of the Plague Year*, is to render a sequence of events—an itinerary—found in historic literature congruently on modern maps and historic map images, accompanied by a navigable timeline. In doing so, we can bring the narrative to life and follow along in real-world context. The project's aim is not limited to Defoe's *Plague Year*. While the application developed has been coded to suit the available data, the concepts, design patterns and thinking can be abstracted out as the project evolves in order to support other works.

## The Data

## Historic Map Images

Two challenges exist in plotting historic locations on historic maps that have been scanned for digital use:

1. We need a system to plot those locations at x, y coordinates within the w, h (width, height) boundaries of the map. A latitude, longitude coordinate system addresses this challenge once the map image has been aligned to a modern map.
2. We need to align the map with a modern map.

NYPL Labs at the New York Public Library published [From Paper Maps to the Web: A DIY Digital Maps Primer](http://www.nypl.org/blog/2015/01/05/web-maps-primer) in January, 2015. This tutorial served as the starting point and primary resource in plotting literary data on historic map images using modern latitude & longitude coordinates. At the core of the tutorial is the use of [MapWarper.net](http://mapwarper.net).

> [Map Warper is] a free to use, open source map warper / map georectifier, and image georeferencer tool. This project is supported by Topomancy LLC and the New York Public Library.

Map Warper is currently available as a public resource. Maps can be saved privately within an account login, or made available publicly. Map Warper is open source, and can be downloaded from GitHub to run on your own server.

Map Warper distorts a historic map image to align with "the Mercator projection which is used in most web mapping projects such as OpenStreetMap or Google Maps." This process ensures that a flat map rendering is aligned with a latitude, longitude coordinate system and also corrects for historical inaccuracies. The resulting, distorted image is said to have been rectified.

We rectify the map by asserting coordinating control points on the historic map image alongside a modern map interface. The more control points we assert, the more accurate the rectified map will be. When we instruct Map Warper to rectify the map, it saves a set of rectified images. In our application, we directly reference these images via a Map Warper URL, which can be used as a tile layer in MapBox API code. A tile layer allows us to pan and zoom our historic map image just as we would a MapBox or Google Maps interface, with the image updated on-demand. It is important to provide a large image to Map Warper, with sufficient resolution that we can zoom in on image details. We uploaded 100MB TIFF files provided by [source...?] as a starting point for the Plague map.

[Document steps to rectify map]

The rectified map can not only be embedded directly in our application, but is also useful in determining latitude and longitude for historic locations found in our data.

[Document GeoJSON]

## The Application

### Jekyll for Data

### JavaScript and GeoJSON Application