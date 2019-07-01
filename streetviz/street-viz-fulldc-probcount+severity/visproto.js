function drawNeighborhoods() {

    // North Cleveland Park - 205
    // Hillsdale - 231

    console.log("drawNeighborhoods");
    d3.json("http://localhost:8000/data/neighborhoods.json", function (err, data) {
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
                'line-color': '#ffffff', // Dark: '#ffffff' //Light: '#606C38', 
                'line-width': 1,
                'line-opacity': 0.9,
                'line-dasharray': [2, 4]
            }
        });
    });
}
function drawStreetLayerProblemCount() {
    d3.json("http://localhost:8000/data/result-trial1.geojson", function (err, data) {
        map.addSource("streets-with-scores", {
            "type": "geojson",
            "data": data
        });

        
        map.addLayer({
            'id': 'streets-by-combined',
            'type': 'line',
            'source': 'streets-with-scores',
            'paint': {
                'line-color': [
                    "interpolate",
                    ["linear"],
                    ["get", "scoreByCombined"],
                    0,
                    "#ffeee0",
                    0.007,
                    "#ff8b0f",
                    .3,
                    "#e00000"
                  ],
                'line-width': 1,
                'line-opacity': 0.9,
            }
        });
    });
}
