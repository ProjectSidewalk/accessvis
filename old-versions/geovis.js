/* Setting up the initial map on page load */

// Setting up toggle buttons functionality
var view = "map";

// City bounds
var southWest = new mapboxgl.LngLat(-77.140, 38.794),
    northEast = new mapboxgl.LngLat(-76.911, 38.997),
    cityBounds = new mapboxgl.LngLatBounds(southWest, northEast);

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

// Zoom-ins to the city bounds with "ease-in" zoom transition
map.fitBounds(cityBounds);

// Add zoom in/out controls
map.addControl(new mapboxgl.NavigationControl({ 'showCompass': false }))
map.doubleClickZoom.disable();

// Full-screen visualization
//map.addControl(new mapboxgl.FullscreenControl());

var detailPane = d3.select('div#detail-pane')
    .attr('class', 'hidden');

var layerApplied = {
    "as-neighborhoods": false,
    "streets": false,
    "features": false
};

// Use Mapbox to implement a D3 geometric transformation.
function projectPoint(lng, lat) {
    var point = map.project(new mapboxgl.LngLat(lng, lat));
    this.stream.point(point.x, point.y);
}

/* Connect mapboxgl+d3 and add d3 elements */

// Get HTML element containing the map's <canvas> element
var mapCanvasContainer = map.getCanvasContainer();
var svg = d3.select(mapCanvasContainer)
    .append("svg");

var mapCanvas = map.getCanvas(), // Returns the map's <canvas> element
    mapContainer = map.getContainer(); // Returns the map's containing HTML element
var width = mapContainer.getBoundingClientRect().width,
    height = mapContainer.getBoundingClientRect().height;

var transform = d3.geoTransform({ point: projectPoint }),
    path = d3.geoPath().projection(transform);

var tooltip = d3.select('body')
    .append('div')
    .attr('class', 'hidden tooltip');

var g = svg.append("g");

map.on('load', function() {

    /* Draw Neighborhood Polygons */
    drawNeighborhoods();
});

// Create a popup, but don't add it to the map yet.
var popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
});

var neighborhoodsFeature;
var currentMouseEvent;

/* Zoom to Neighborhood on Click/Zoom In */

var activeNeighborhood = null;
var flying = false;

// Detect fly motion is done
map.on('flystart', function() {
    flying = true;
});
map.on('flyend', function() {
    flying = false;
});
map.on('moveend', function(e) {
    if (flying) {
        if (view != "detail-pane") {
            // Show detail info pane                
            toggleView(activeNeighborhood);
        } else {
            // Update already loaded detail pane
            updateDetailPane(activeNeighborhood);
        }
        map.fire('flyend');
    }
});

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


// Holds previous fetch sidewalk data
var psData = {};
var prevView;

function drawNeighborhoods() {
    d3.json("data/neighborhoods.json", function(err, data) {

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
                'fill-opacity': 0,
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
    });

    map.on("viewreset", resetSelectedNeighborhoodPolygon);
    // For animated transitions
    map.on("movestart", resetSelectedNeighborhoodPolygon);
    map.on("move", resetSelectedNeighborhoodPolygon);
    map.on("moveend", resetSelectedNeighborhoodPolygon);
    // For panning
    map.on("dragstart", resetSelectedNeighborhoodPolygon);
    map.on("drag", resetSelectedNeighborhoodPolygon);
    map.on("dragend", resetSelectedNeighborhoodPolygon);

    function zoomIntoSelectedNeighborhood(e, initType) {
        var features = map.queryRenderedFeatures(e.point, {
            layer: ['neighborhood-fill'],
        });
        if (features.length && features[0].properties.region_id) {

            var regionName = features[0].properties.region_name;
            var regionId = features[0].properties.region_id;

            // Zoom into the appropriate region with the specified bbox
            if (activeNeighborhood != regionId) {
                activeNeighborhood = regionId;

                // Zoom to the neighborhood                        
                var bbox = turf.bbox(features[0]);
                if (initType == 'click') {
                    console.log("Clicked region: " + regionName + " ID: " + regionId);
                    var startLat = bbox[1],
                        startLng = bbox[0],
                        endLat = bbox[3],
                        endLng = bbox[2];
                    if (psData[regionId] === undefined) {

                        // Are we going from main map view to detail view
                        // If current view is map view, then isFullView= true else false
                        var isFullView = false;
                        if (view == "map") {
                            isFullView = true;
                            prevView = 'map';
                        } else prevView = 'detail-pane';
                        psData[regionId] = {
                            'neighborhood': { 'border-data': features[0], 'data': null },
                            'streets': { 'data': null, 'is-full-view': isFullView },
                            'features': { 'data': null, 'is-full-view': isFullView }
                        }
                    }
                    fetchData(startLat, startLng, endLat, endLng, "streets", regionId);
                    fetchData(startLat, startLng, endLat, endLng, "features", regionId);
                    zoomToFit(bbox);
                } else {
                    console.log("Zoomed-in region: " + regionName + " ID:" + regionId);
                }
                map.fire('flystart');

            } else {
                // If clicked in the same selected neighborhood, reset the map
                zoomOutToMainView();
                if (view == "map") prevView = 'map';
                else prevView = 'detail-pane';
                activeNeighborhood = null;
            }
        } else {
            // If clicked outside the map, reset the map
            if (activeNeighborhood) {
                if (view == "map") prevView = 'map';
                else prevView = 'detail-pane';
                toggleView();
            }
            activeNeighborhood = null;
            resetView();
        }
    }

    /* Hover Effect - Change Color */
    // Reference: https://www.mapbox.com/mapbox-gl-js/example/hover-styles/

    // When the user moves their mouse over the neighborhood-fill layer, we'll update the filter in the neighborhood-fill-hover layer to only show the matching state, thus making a hover effect.
    map.on("mousemove", "neighborhood-fill", function(e) {
        map.setFilter("neighborhood-fill-hover", ["==", "region_id", e.features[0].properties.region_id]);
    });

    // Reset the neighborhood-fill-hover layer's filter when the mouse leaves the layer.
    map.on("mouseleave", "neighborhood-fill", function() {
        map.setFilter("neighborhood-fill-hover", ["==", "region_id", ""]);
    });

    /* Hover Effect - Show Tooltip */
    map.on('mousemove', function(e) {

        var features = map.queryRenderedFeatures(e.point, {
            layers: ["neighborhood-fill"]
        });

        if (features.length && features[0].properties.region_id) {
            // Change the cursor style as a UI indicator.
            mapCanvas.style.cursor = 'pointer';

            currentMouseEvent = e;
            var currentMousePosition = e.point;
            tooltip.classed('hidden', false)
                .attr('style', 'left:' + (currentMousePosition['x'] + 15) +
                    'px; top:' + (currentMousePosition['y'] - 35) + 'px')
                .html(features[0].properties.region_name);

        } else {
            //if not hovering over a feature set tooltip to empty                    
            mapCanvas.style.cursor = '';
            tooltip.classed('hidden', true);
        }

    });

    map.on('mouseleave', 'neighborhood-fill', function() {
        tooltip.classed('hidden', true);
    });

    /* Zoom to Neighborhood on Click/Zoom In */
    map.on('click', function(e) {
        zoomIntoSelectedNeighborhood(e, 'click');
    });
}

function visualizeStreets(data) {
    if (data) {
        var layerId = 'streets';
        map.addLayer({
            'id': layerId,
            'type': 'line',
            'source': {
                'type': 'geojson',
                'data': data
            },
            'paint': {
                'line-width': 2,
                // Use a get expression (https://www.mapbox.com/mapbox-gl-js/style-spec/#expressions-get)
                // to set the line-color to a feature property value.
                'line-color': '#606C38' //['get', 'color']
            }
        });
        layerApplied[layerId] = true;
    }
}

function visualizeAttributes(data) {
    if (data) {
        var layerId = 'features';
        map.addLayer({
            "id": layerId,
            "type": "circle",
            "source": {
                "type": "geojson",
                "data": data
            },
            'paint': {
                // make circles larger as the user zooms from z12 to z22
                'circle-radius': {
                    'base': 2,
                    'stops': [
                        [12, 2],
                        [22, 60]
                    ]
                },
                // color circles by label_type, using a match expression
                // https://www.mapbox.com/mapbox-gl-js/style-spec/#expressions-match
                'circle-color': '#12111E', //Dark: '#FEFAE0', //'#d9d9d9' 
                /*[
                    'match', ['get', 'label_type'],
                    'CurbRamp', '#ee8a45',
                    // rest of the problem labels 'rgba(179, 179, 179, 1)'
                    '#ee8a65'
                ]*/
                'circle-opacity': 0.8
            }
        });
        layerApplied[layerId] = true;
    }
}

map.setMinZoom(minZoom);