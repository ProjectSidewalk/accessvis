/* Setting up the initial map on page load */

// Setting up toggle buttons functionality
var view = "map";
var prevView = "map";
var toDetailView = false;

window.onload = function () {
    document.getElementById("container1").style.display = "none";
    document.getElementById("container2").style.display = "none";
};

// City bounds
var southWest = new mapboxgl.LngLat(-77.140, 38.794),
    northEast = new mapboxgl.LngLat(-76.891, 38.997),
    cityBounds = new mapboxgl.LngLatBounds(southWest, northEast);
var boxInitialPosition = new mapboxgl.LngLat(-77.008, 38.899);
var boxInitialPositionEdge = new mapboxgl.LngLat(-76.971, 38.920);

// Setup map
mapboxgl.accessToken = 'pk.eyJ1IjoibWFuYXN3aSIsImEiOiJjamg5c2hmZ2swZnpvMzhxZ28wcmhvb2NwIn0.MYu7KmIcoYH8k78mQh7wWA';
var minZoom = 11,
    maxZoom = 18;

var map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mapbox/light-v8', // stylesheet location
    center: [-77.039, 38.897], // starting position [lng, lat]
    zoom: 2, // starting zoom
    maxZoom: maxZoom
});


// Add zoom in/out controls
map.addControl(new mapboxgl.NavigationControl({'showCompass': false}));
map.doubleClickZoom.disable();

// Zoom-ins to the city bounds with "ease-in" zoom transition
map.fitBounds(cityBounds);

// Full-screen visualization
//map.addControl(new mapboxgl.FullscreenControl());

// Setting up brushing feature
var brush;
var boxStartlat;
var boxStartLng;
var boxStarted = false;
var bbox;

// Holds previous fetch sidewalk data
var psData = {};
var started = false;
var avgScore = 0;
var labelList = ['CurbRamp', 'NoCurbRamp', 'SurfaceProblem', 'Obstacle'];

var detailPane = d3.select('div#detail-pane')
    .attr('class', 'hidden');

var overviewInfoBox = d3.select('#overview-info-box')
    .attr('class', 'overview-info-box box hidden');

var infoBox = d3.select('#info-box')
    .attr('class', 'info-box box hidden');

var legend = d3.select('#legend')
    .attr('class', 'hidden');

var layerApplied = {
    "as-neighborhoods": false,
    "streets": false,
    "features": false,
    "color-layer": false
};

// Use Mapbox to implement a D3 geometric transformation.
function projectPoint(lng, lat) {
    var point = map.project(new mapboxgl.LngLat(lng, lat));
    this.stream.point(point.x, point.y);
}

/* Connect mapboxgl+d3 and add d3 elements */

// Get HTML element containing the map's <canvas> element
var mapCanvasContainer = map.getCanvasContainer();
var svgOuter = d3.select(mapCanvasContainer)
    .append("svg");

var mapCanvas = map.getCanvas(), // Returns the map's <canvas> element
    mapContainer = map.getContainer(); // Returns the map's containing HTML element
var width = mapContainer.getBoundingClientRect().width,
    height = mapContainer.getBoundingClientRect().height;

var transform = d3.geoTransform({point: projectPoint}),
    path = d3.geoPath().projection(transform);

var svgStreets = d3.select("#streets-container");
var tooltip = d3.select('body')
    .append('div')
    .attr('class', 'hidden tooltip');

var g = svgOuter.append("g");
var lines;

// Create a popup, but don't add it to the map yet.
var popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
});

var neighborhoodsFeature;
var currentMouseEvent;

// Support for scroll zoom for getting to the street level
var zoomThreshold = 12;
/*map.on('zoom', function() {
    if (activeNeighborhood === null) {
        console.log("active:" + activeNeighborhood);
        if (currentMouseEvent && 
            view == "map" &&
            (map.getZoom() > zoomThreshold)) {
            zoomIntoSelectedNeighborhood(currentMouseEvent, 'zoom');
        }
    }
});*/

// Zoom to Neighborhood on Click/Zoom In
var activeNeighborhood = null;
var flying = false;

map.on('load', function () {
    console.log("Before drawing:" + map.getCenter());

    populateBorderData();
    /* Draw Neighborhood Polygons */
    drawNeighborhoods();
});

map.setMinZoom(minZoom);

// Disable map interactions when the overview panel is shown
disableMap();

function insertRegionData(regionId) {
    if (psData[regionId] === undefined) {
        psData[regionId] = {
            'neighborhood': {'border-data': null, 'data': null},
            'streets': {'data': null},
            'features': {'data': null}
        }
    }
}


function populateBorderData() {
    d3.json("data/neighborhoods.json", function (err, data) {
        data.features.forEach(function (entry) {
            var regionId = entry.properties.region_id;
            insertRegionData(regionId);
            psData[regionId]['neighborhood']['border-data'] = entry;
        });
    });
}

function drawNeighborhoods() {

    d3.json("data/neighborhoods.json", function (err, data) {

        console.log("drawNeighborhoods");
        map.addSource("neighborhoods", {
            "type": "geojson",
            "data": data
        });

        // Border layer
        map.addLayer({
            'id': 'neighborhood-border',
            'type': 'line',
            'source': 'neighborhoods',
            'paint': {
                'line-color': '#606C38', // Dark: '#ffffff',
                'line-width': 1,
                'line-opacity': 0.9,
                'line-dasharray': [2, 4]
            }
        });

        // Fill layer
        map.addLayer({
            'id': 'neighborhood-fill',
            'type': 'fill',
            'source': 'neighborhoods',
            'paint': {
                'fill-color': '#000fff',
                'fill-opacity': 0
            }
        });

        // Hover layer
        map.addLayer({
            "id": "neighborhood-fill-hover",
            "type": "fill",
            "source": 'neighborhoods',
            "layout": {},
            "paint": {
                "fill-color": "#BC6C25",
                "fill-opacity": 0.7
            },
            "filter": ["==", "region_id", ""]
        });

        // Brushing
        // console.log("Original = " + southWest);
        // console.log(map.project(southWest).x);

        // southWest = new mapboxgl.LngLat(-77.140, 38.794);
        // console.log(map.project(southWest).x);
        // console.log("New = " + southWest);

        // console.log("Original = " + northEast);
        // northEast = new mapboxgl.LngLat(-76.911, 38.997);

        // console.log("New = " + northEast);
        console.log("Creating brush");
        //southWest = new mapboxgl.LngLat(-77.140, 38.794);
        //northEast = new mapboxgl.LngLat(-76.911, 38.997)
        //var brush = d3.brush()
        // document.querySelector('.brush').firstChild.remove();
        // alert("Drawing neighborhood again");
        brush = d3.brush()
            .on("start", function () {
                console.log("brush started");
                if (d3.event.selection) {
                    var d = d3.event.selection;
                    var array = [d3.event.selection[0][0], d3.event.selection[0][1]];
                    var arrayEnding = [d3.event.selection[1][0], d3.event.selection[1][1]];
                    console.log(map.unproject(array));
                    boxStartlat = map.unproject(array).lat;
                    boxStartLng = map.unproject(array).lng;
                    // console.log("brush start finished");
                }
            })
            .on("brush", function () {
                moved = true;
                /*if(!boxStarted) {
                    console.log("box started");
                    var array = [d3.event.selection[0][0], d3.event.selection[0][1]];
                    var arrayEnding = [d3.event.selection[1][0], d3.event.selection[1][1]];
                    boxStartlat = map.unproject(array).lat;
                    boxStartLng = map.unproject(array).lng;
                }*/
            })
            .on("end", function (p) {
                // console.log("brush ended");
                if (!d3.event.sourceEvent) return;
                console.log("box ended");
                // console.log(d3.event.selection);
                if (d3.event.selection !== undefined && d3.event.selection !== null &&
                    d3.event.selection[0] !== undefined && d3.event.selection[0] !== null) {
                    maxSelectionSizeX = 225;
                    maxSelectionSizeY = 225;
                    // console.log("At index 1 = " + d3.event.selection[1]);
                    // console.log("At index 0 = " + d3.event.selection[0]);
                    var location = d3.event.selection;
                    if ((d3.event.selection[1][0] - d3.event.selection[0][0] > maxSelectionSizeX) &&
                        (d3.event.selection[1][1] - d3.event.selection[0][1] > maxSelectionSizeY)) {
                        // selection is too large; animate back down to a more reasonable size
                        // console.log("d3.event.selection[0][0] = " + d3.event.selection[0][0]);
                        // console.log("d3.event.selection[0][1] = " + d3.event.selection[0][1]);
                        // console.log("d3.event.selection[1][0] = " + d3.event.selection[1][0]);
                        // console.log("d3.event.selection[1][1] = " + d3.event.selection[1][1]);

                        var brushCenterX = (d3.event.selection[0][0] + d3.event.selection[1][0]) / 2.0;
                        var brushCenterY = (d3.event.selection[0][1] + d3.event.selection[1][1]) / 2.0;
                        // console.log("brushCenterX = " + (d3.event.selection[0][0] + d3.event.selection[1][0]) / 2.0);
                        // console.log("brushCenterY = " + (d3.event.selection[0][1] + d3.event.selection[1][1]) / 2.0);
                        // console.log("Greater than max size");
                        var change = [[
                            brushCenterX - 0.5 * maxSelectionSizeX,
                            brushCenterY - 0.5 * maxSelectionSizeY],// - 0.49 * maxSelectionSizeY],
                            [brushCenterX + 0.5 * maxSelectionSizeX,// + 0.49 * maxSelectionSizeX,
                                brushCenterY + 0.5 * maxSelectionSizeY]// + 0.49 * maxSelectionSizeY]
                        ];
                        location = change;
                        d3.select(this).transition()
                            .duration(400)
                            .call(brush.move, change);
                    }
                    var array = [location[0][0], location[0][1]];
                    // console.log("starting of box from " + d3.event.selection[0][0] + ", " + d3.event.selection[0][1]);
                    var arrayEnding = [location[1][0], location[1][1]];
                    // console.log("box ending at " + d3.event.selection[1][0] + ", " + d3.event.selection[1][1]);
                    ///console.log(d3.event.selection);
                    //console.log("brush ended");
                    endingLng = map.unproject(arrayEnding).lng;
                    endingLat = map.unproject(arrayEnding).lat;
                    if (moved) {
                        console.log("Changing box start lng in end function");
                        boxStartlat = map.unproject(array).lat;
                        boxStartLng = map.unproject(array).lng;
                        moved = false;
                    }
                    document.getElementById("loading-icon").style.display = "block";

                    fetchData(boxStartlat, boxStartLng, endingLat, endingLng, "neighborhoods", null);
                }
            })
            .extent([
                [0, 0], [width, height]
                // [map.project(southWest).x, 0],
                // [map.project(northEast).x, height]
            ]);

        // Positioning brush
        g.attr('class', 'brush').call(brush);

        // console.log("Box initial position = " + boxInitialPosition);
        // console.log("projected = " + map.project(boxInitialPositionEdge).x);

        //var arrayInitial = [[map.project(boxInitialPosition).x, map.project(boxInitialPosition).y],[map.project(boxInitialPositionEdge).x, map.project(boxInitialPositionEdge).y]];
        //console.log("Array Initial = " + arrayInitial);
        //g.call(brush.move, arrayInitial);

        // console.log(map.project(southWest).x);
        // console.log(map.project(northEast).x);
        // console.log(height);

        g.selectAll("brush").attr('class', 'brush').on("load", function () {
            console.log("loaded");
        });

    });

    /* Hover Effect - Change Color */
    // Reference: https://www.mapbox.com/mapbox-gl-js/example/hover-styles/

    // When the user moves their mouse over the neighborhood-fill layer, we'll update the filter in the
    // neighborhood-fill-hover layer to only show the matching state, thus making a hover effect.
    map.on("mousemove", "neighborhood-fill", function (e) {
        if(map.getLayer("neighborhood-fill-hover"))
            map.setFilter("neighborhood-fill-hover", ["==", "region_id", e.features[0].properties.region_id]);
    });

    // Reset the neighborhood-fill-hover layer's filter when the mouse leaves the layer.
    map.on("mouseleave", "neighborhood-fill", function () {
        if(map.getLayer("neighborhood-fill-hover"))
            map.setFilter("neighborhood-fill-hover", ["==", "region_id", ""]);
    });

    /* Hover Effect - Show Tooltip */
    map.on('mousemove', function (e) {

        var features = map.queryRenderedFeatures(e.point, {
            layers: ["neighborhood-fill"]
        });

        if (features.length && features[0].properties.region_id) {
            var regionId = features[0].properties.region_id;
            //updateInfoBoxScores(features);

            // Change the cursor style as a UI indicator.
            mapCanvas.style.cursor = 'pointer';

            currentMouseEvent = e;
            var currentMousePosition = e.point;
            tooltip.classed('hidden', false)
                .attr('style', 'left:' + (currentMousePosition['x'] + 15) +
                    'px; top:' + (currentMousePosition['y'] - 35) + 'px')
                .html(features[0].properties.region_name);
            updateInfoBoxScores(features[0].properties.region_name, null);

        } else {
            //if not hovering over a feature set tooltip to empty
            mapCanvas.style.cursor = '';
            tooltip.classed('hidden', true);
        }
    });

    map.on('mouseleave', 'neighborhood-fill', function () {
        tooltip.classed('hidden', true);
    });

    /* Update d3 drawing */
    map.on("viewreset", updateDrawing);

    // For animated transitions
    map.on("movestart", updateDrawing);
    map.on("move", updateDrawing);
    map.on("moveend", updateDrawing);

    // For panning
    map.on("dragstart", updateDrawing);
    map.on("drag", updateDrawing);
    map.on("dragend", updateDrawing);

    /* Zoom to Neighborhood on Click/Zoom In */
    map.on('click', function (e) {
        // Remove brush
        g.call(brush.move, null);
        mapCanvas.style.cursor = 'pointer';
        document.querySelector(".brush").style.display = "none";
        zoomIntoSelectedNeighborhood(e, 'click');
    });

    // Detect fly motion is done
    map.on('flystart', function () {
        flying = true;
    });
    map.on('flyend', function () {
        flying = false;
    });
    map.on('moveend', function (e) {
        if (flying) {
            if (view !== "detail-pane") {
                // Show detail info pane
                toggleView(activeNeighborhood);
            } else {
                // Update already loaded detail pane
                updateDetailPane(activeNeighborhood);
            }
            populateDetailPane();
            map.fire('flyend');
        }
    });

    function zoomIntoSelectedNeighborhood(e, initType) {
        var features = map.queryRenderedFeatures(e.point, {
            layer: ['neighborhood-fill']
        });
        if (features.length && features[0].properties.region_id) {

            var regionName = features[0].properties.region_name;
            var regionId = features[0].properties.region_id;

            // Zoom into the appropriate region with the specified bbox
            if (activeNeighborhood !== regionId) {
                activeNeighborhood = regionId;

                // Zoom to the neighborhood
                bbox = turf.bbox(psData[regionId]["neighborhood"]["border-data"]);
                if (initType === 'click') {
                    console.log("Clicked region: " + regionName + " ID: " + regionId);
                    var startLat = bbox[1],
                        startLng = bbox[0],
                        endLat = bbox[3],
                        endLng = bbox[2];

                    insertRegionData(regionId);
                    toDetailView = true;

                    if (!psData[regionId]["neighborhood"]["data"])
                        fetchData(startLat, startLng, endLat, endLng, "neighborhoods", regionId);

                    document.getElementById("loading-icon").style.display = "block";
                    fetchData(startLat, startLng, endLat, endLng, "streets", regionId);
                    fetchData(startLat, startLng, endLat, endLng, "features", regionId);
                } else {
                    console.log("Zoomed-in region: " + regionName + " ID:" + regionId);
                }
            } else {
                // If clicked in the same selected neighborhood, reset the map
                zoomOutToMainView();
            }
        } else {
            // If clicked outside the map, reset the map
            if (activeNeighborhood) {
                toggleView();
            }
            activeNeighborhood = null;
            toDetailView = false;
            resetView();
        }
    }
}