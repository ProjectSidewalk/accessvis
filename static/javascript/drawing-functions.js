function checkAndRemoveLayerApplied(layerName) {
    if (layerApplied[layerName]) {
        if (layerName === "streets") {
            console.log("Streets Layer removed");
            lines.remove();
        } else {
            labelList.forEach(function (layerId) {
                if (map.getLayer(layerId)){
                    map.removeLayer(layerId);
                    map.removeSource("features");
                }
            });
        }
        layerApplied[layerName] = false;
    }
}

function applyStreetLayer(regionId) {
    checkAndRemoveLayerApplied("streets");
    drawStreets(psData[regionId]['streets']['data']);
}

function applyFeatureLayer(regionId) {
    console.log("Drawing Features for " + regionId);
    checkAndRemoveLayerApplied('features');
    console.log(psData[regionId]['features']);
    drawFeatureLayers(psData[regionId]['features']['data']);
}

var scale = d3.scaleSequential(d3.interpolateViridis)
    .domain([1, 0]);

function drawStreets(data) {
    if (data) {
        console.log("Drawing Streets");
        var layerId = 'streets';
        // var scale = d3.scaleLinear()
        //     .domain([0, 1])
        //     .range(['#ffffcc', '#c7e9b4', '#7fcdbb', '#41b6c4', '#1d91c0', '#225ea8', '#0c2c84']);

        lines = svgStreets
            .selectAll("path")
            .data(data.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("id", "street-segments")
            .attr("class", "street-segments")
            .style("stroke", function (d) {
                return scale(d.properties.score);
            })
            .on('mousemove', function (d) {
                console.log("Tool called");
                var mouse = d3.mouse(svgStreets.node()).map(function (d) {
                    return parseInt(d);
                });
                tooltip.classed('hidden', false)
                    .attr('style', 'left:' + (mouse[0] + 15) +
                        'px; top:' + (mouse[1] - 35) + 'px')
                    .html("Score: " + d.properties.score);
            })
            .on('mouseout', function () {
                tooltip.classed('hidden', true);
            });

        layerApplied[layerId] = true;
    } else {
        console.error("Data not available");
    }
}

function drawSelectedNeighborhoodPolygon(regionId) {
    svgOuter.append("path")
        .attr("d", path(psData[regionId]['neighborhood']['border-data']))
        .attr("id", "neighborhood-selected")
        .attr("class", "neighborhood-selected");
}

function updateSelectedNeighborhoodDrawing(regionId) {
    d3.select("#neighborhood-selected")
        .transition()
        .attr("d", path(psData[regionId]['neighborhood']['border-data']));

    updateStreetLayer(regionId);
    //updateFeatureLayer(regionId);
}

function updateStreetLayer(regionId) {
    var data = psData[regionId]['streets']['data'];
    lines.exit().remove();
    applyStreetLayer(regionId);
    console.log("Redrawn streets");
}

function updateFeatureLayer(regionId) {
    checkAndRemoveLayerApplied('features');
    applyFeatureLayer(psData[regionId]['features']['data']);
    console.log("Redrawn features");
}

// Reposition the SVG to cover the features
function resetSelectedNeighborhoodPolygon() {
    var allNBorders = d3.select("#neighborhood-selected");

    if (!allNBorders.empty()) {
        allNBorders
            .attr("d", path(psData[activeNeighborhood]['neighborhood']['border-data']));
    }
}

//update D3 shapes' positions to the map's current state
function updateDrawing() {
    if (view === "map") {
    } else if (view === "detail-pane") {
        resetSelectedNeighborhoodPolygon();
        if (psData[activeNeighborhood]['streets']['data'])
            resetSelectedNeighborhoodStreets();
    }
}

function resetSelectedNeighborhoodStreets() {
    var allStreets = d3.select("#street-segments");

    if (!allStreets.empty()) {
        var data = psData[activeNeighborhood]['streets']['data'];
        allStreets
            .attr("d", path(data))
            .style("stroke", function (d) {
                return scale(d.properties.score);
            });
    }
}

function removeSelectedNeighborhoodDrawing() {
    d3.select("#neighborhood-selected").remove();
    d3.select("#street-segments").remove();
}

function drawFeatureLayers(data) {
    if (data) {

        map.addSource("features", {
            "type": "geojson",
            "data": data
        });

        data.features.forEach(function (feature) {
            var labelType = feature.properties['label_type'];
            var layerId = labelType;

            // Add a layer for this symbol type if it hasn't been added already.
            if (!map.getLayer(layerId)) {
                map.addLayer({
                    "id": layerId,
                    "type": "circle",
                    "source": "features",
                    "layout": {
                        "visibility": "visible"
                    },
                    "paint": {
                        'circle-radius': 5,
                        // color circles by label_type, using a match expression
                        // https://www.mapbox.com/mapbox-gl-js/style-spec/#expressions-match
                        'circle-color': //'#12111E', //Dark: '#FEFAE0', //'#d9d9d9'
                        [
                            'match', ['get', 'label_type'],
                            'CurbRamp', '#6ADE86',
                            'NoCurbRamp', '#E92A71',
                            'SurfaceProblem', '#F1AB0B',
                            'Obstacle', '#00A1CB',
                            '#B3B3B3'
                        ],
                        'circle-opacity': 0.6
                    },
                    "filter": ["==", "label_type", labelType]
                });

                layerApplied[layerId] = true;
            }
        });

        // Event handler
        $(".detail-pane-info div").click(function(e) {
            //showAndHideLabels(this);
            var layerId = this.id;
            map.setLayoutProperty(layerId, 'visibility',
                !layerApplied[layerId] ? 'visible' : 'none');
            layerApplied[layerId] = !layerApplied[layerId];
        });
    }
}