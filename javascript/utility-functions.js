/* Helper Functions */
function round(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
}

function disableMap() {
    $("#overlay").addClass("overlay");
    map.scrollZoom.disable();
}

function enableMap() {
    $("#overlay").removeClass("overlay");
    map.scrollZoom.enable();
}

function showModal() {
    $("#overview-pane").removeClass("hidden");
    infoBox.classed('hidden', true);
    legend.classed('hidden', true);
    overviewInfoBox.classed('hidden', true);
    disableMap();
    $("#btn-close").html("Close");
}

function closeModal() {
    $("#overview-pane").addClass("hidden");
    infoBox.classed('hidden', false);
    legend.classed('hidden', false);
    overviewInfoBox.classed('hidden', false);
    enableMap();
}

// Set function for reset view button
function resetView() {
    map.fitBounds(cityBounds);
}

// Zoom to a specific bounds
function zoomToFit(bbox) {
    console.log("Zooming into the neighborhood");
    map.fire('flystart');
    map.fitBounds(bbox, {padding: 100});
}

// Zoom out to the base leve
function zoomOutToMainView() {
    currentMouseEvent = null;
    //alert("remaking brush");
    document.querySelector(".brush").style.display = "block";
    toggleView();
    resetView();

    if (view === "map") prevView = 'map';
    else prevView = 'detail-pane';
    activeNeighborhood = null;
    toDetailView = false;
}

function setMapOpacity(value) {
    d3.selectAll(".mapboxgl-canvas")
        .transition()
        .duration(500)
        .style("opacity", value);
    d3.selectAll(".mapboxgl-control-container")
        .transition()
        .duration(500)
        .style("opacity", value);
}

function showAndHideLabels(ele) {
    var labelType = ele.id;
    console.log("Showing labels:" + labelType);
}

/* Code of show/hide map would be used when showing the detail view pane */
function showMainMap() {
    setMapOpacity(1);

    // Show Reset View
    d3.select("#reset-view")
        .classed('hidden', false);

    // d3.select("#legend")
    //     .classed('hidden', false);

    d3.select("#overview-info-box")
        .classed('hidden', false);

    // Enable map interaction
    map.scrollZoom.enable();
    map.dragPan.enable();

    d3.selectAll("#btn-toggle-view")
        .transition()
        .duration(500);

    // if(!map.getLayer("neighborhood-fill-hover"))
    //     map.addLayer("neighborhood-fill-hover");
}

function hideMainMap() {
    setMapOpacity(0.1);

    // Hide Reset View
    d3.select("#reset-view")
        .classed('hidden', true);

    // d3.select("#legend")
    //     .classed('hidden', true);

    d3.select("#overview-info-box")
        .classed('hidden', true);

    // Disable map interaction
    map.scrollZoom.disable();
    map.dragPan.disable();

    // Show "Back to Main Map" button with animation
    d3.selectAll("#btn-toggle-view")
        .transition()
        .duration(500);

    // if(map.getLayer("neighborhood-fill-hover"))
    //     map.removeLayer("neighborhood-fill-hover");
}

function toggleLayers(layerName, data) {
    if (layerApplied[layerName]) {
        map.removeLayer(layerName);
        map.removeSource(layerName);
        layerApplied[layerName] = false;
    }
}

function toggleView(regionId) {
    // Toggle active view
    console.log('Toggling: ' + regionId);
    if (view === "map") {
        view = "detail-pane";
        hideMainMap();
        showDetailPane(regionId);
    } else if (view === "detail-pane") {
        view = "map";
        hideDetailPane();
        showMainMap();
    }
}

function showDetailPane(regionId) {
    // document.getElementById('container1').style.display="none";
    // document.getElementById("container2").style.display="none";
    detailPane.classed('hidden', false);
    console.log("Showing detail panel for: " + regionId);
    drawSelectedNeighborhoodPolygon(regionId);
    applyStreetLayer(regionId);
    // drawRegionData(regionId);
}

function hideDetailPane() {
    // document.getElementById('container1').style.display="block";
    // document.getElementById("container2").style.display="block";
    detailPane.classed('hidden', true);

    //Refresh label counts
    refreshLabelCounts();
    document.getElementById("average-info").innerHTML = "";

    // Remove layers
    checkAndRemoveLayerApplied('features');
    removeSelectedNeighborhoodDrawing();
}

function updateDetailPane(regionId) {
    console.log("Updating the pane for: " + regionId);

    //Refresh detail pane
    refreshLabelCounts();

    // Draw new region
    updateSelectedNeighborhoodDrawing(regionId);

}

/* Data Fetching Functions */

function fetchData(lat1, lng1, lat2, lng2, type, regionId) {

    // console.log("lat1 = " + lat1 + " ,lat2 = " + lat2 + " ,lng1  = " + lng1 + " ,lng2 = " + lng2);

    var baseURL = "https://cors-anywhere.herokuapp.com/http://sidewalk.umiacs.umd.edu/v1/access/";
    var queryString = type + "?lat1=" + lat1 + "&lng1=" + lng1 + "&lat2=" + lat2 + "&lng2=" + lng2;

    var fetchASURL = baseURL + "score/" + queryString;
    var fetchFeaturesURL = baseURL + queryString;
    if (type === 'neighborhoods') {
        // Fetch neighborhood level data
        if (!regionId || (regionId && psData[regionId]['neighborhood']['data'] === null)) {
            console.log("Fetching from: " + fetchASURL);
            fetch(fetchASURL)
                .then(checkStatus)
                .then(function (data) {
                    if (regionId) {
                        psData[regionId]['neighborhood']['data'] = data;
                        console.log(regionId + " Neighborhood Data updated!");
                    }
                    return data;
                })
                .then(populateInfoBox)
                .catch(function (error) {
                    console.error("[NeighborhoodsFetch] Error while getting data " + error);
                });
        }
    } else if (type === 'streets') {
        // Fetch street level data
        if (psData[regionId]['streets']['data'] === null) {
            console.log("Fetching from:" + fetchASURL);
            fetch(fetchASURL)
                .then(checkStatus)
                .then(function (data) {
                    psData[regionId]['streets']['data'] = data;
                    console.log(regionId + " Street Data updated!");
                })
                .then(function () {
                    zoomToFit(bbox);
                })
                .catch(function (error) {
                    console.error("[StreetsFetch] Error while getting data: " + error);
                });
        } else {
            console.log("Data present. Zooming directly.");
            document.getElementById("loading-icon").style.display = "none";
            zoomToFit(bbox);
        }
    } else {
        // Fetch labels
        if (psData[regionId]['neighborhood']['data'] === null) {
            console.log("Fetching from:" + fetchFeaturesURL);
            fetch(fetchFeaturesURL)
                .then(checkStatus)
                .then(function (data) {
                    psData[regionId]['features']['data'] = data;
                    console.log(regionId + " Feature Data updated!");
                })
                .then(function() {
                    //applyFeatureLayer(regionId);
                })
                .catch(function (error) {
                    console.error("[FeaturesFetch] Error while getting data: " + error);
                });
        }
    }
}

function checkStatus(response) {
    // console.log(response);
    if (response.status >= 200 && response.status <= 300 || response.status === 0) {
        var data = response.json();
        document.getElementById("loading-icon").style.display = "none";
        return data;
    } else {
        console.error("Promise rejected");
    }
}

function populateInfoBox(response) {

    if (response.features.length > 0) {
        console.log(response);
        colorNeighborhoods(response);
        calculateAverageScore();
        if (view === "map" && !toDetailView) {
            plotMax5Charts(response);
            makeHistogram();
            displayAverageScore();
        } else {
            // Clear the neighborhood level plots and show street level plots
            // Temporary code
            //document.getElementById("average-info").innerHTML = "";
            document.getElementById("container1").style.display = "none";
            document.getElementById("container2").style.display = "none";
        }
    } else {
        document.getElementById("info-panel-instruction").innerHTML = "Selection doesn't enclose a complete neighborhood. " +
            "Create another box";
    }
}

/* Detail Pane */
function populateDetailPane() {
    calculateTotalLabelCount();
    calculateAverageStreetScore();

    displayAverageStreetScore();
    displayLabelCounts();
    plotLabelCountsBubbleChart();
    plotStreetScoreHistogram();
}

var avgStreetScore;

function calculateAverageStreetScore() {
    console.log("Calculating Average Street Score");
    var data = psData[activeNeighborhood]["streets"]["data"]["features"];
    var total = 0;
    var count = 0; Object.keys(data).length;
    for(var i in data){
            total += round(data[i]["properties"]["score"], 1);
            count += 1;
    }
    avgStreetScore = round(total * 100 / count, 1);
}

function displayAverageStreetScore() {
    document.getElementById("average-info").innerHTML = "Average street score <span>" + parseFloat(avgStreetScore) + "</span>";
}

var labelCount;
function calculateTotalLabelCount() {
    console.log("Calculating Label Count Per Type");
    labelCount = {
        "CurbRamp": 0,
        "NoCurbRamp": 0,
        "SurfaceProblem": 0,
        "Obstacle": 0
    };
    var data = psData[activeNeighborhood]["streets"]["data"]["features"];
    var total = 0;
    for(var i in data) {
        var labelFeatures = data[i]["properties"]["feature"];
        for (var labelType in labelFeatures) {
            if (labelFeatures.hasOwnProperty(labelType)) {
                labelCount[labelType] += labelFeatures[labelType];
            }
        }
    }

    console.log(JSON.stringify(labelCount));
}

function refreshLabelCounts() {
    for(var labelType in labelCount) {
        if (labelCount.hasOwnProperty(labelType)) {
            var list = document.getElementById(labelType);
            if (list.childNodes[2]) list.removeChild(list.childNodes[2]);
        }
    }
}

function displayLabelCounts() {
    for(var labelType in labelCount) {
        if (labelCount.hasOwnProperty(labelType)) {
            $("#" + labelType).append("<span>" + parseFloat(labelCount[labelType]) + "</span>");
        }
    }
}

function plotLabelCountsBubbleChart() {

    var svgBubbleChart = d3.select("#label-counts");

}

function plotStreetScoreHistogram() {

}


function colorNeighborhoods(response) {
    var layerId = 'color-layer';
    for (var i = 0; i < response["features"].length; i++) {
        var region_id = response["features"][i]["properties"]["region_id"];
        if (psData[region_id]) {
            psData[region_id]["neighborhood"]["data"] = response.features[i];
        } else {
            psData[region_id] = {
                'neighborhood': {'border-data': null, 'data': response.features[i]},
                'streets': {'data': null, 'is-full-view': (view === "map")},
                'features': {'data': null, 'is-full-view': (view === "map")}
            }
        }
    }

    if (!started) {
        started = true;
        map.addSource('as-polygons', {type: 'geojson', data: response});
        map.addLayer({
            'id': layerId,
            'type': 'fill',
            'source': 'as-polygons',
            'paint': {
                'fill-color': ['interpolate', ['linear'], ['get', 'score'], 0, '#ffffcc', 0.2, '#c7e9b4', 0.4,
                    '#7fcdbb', 0.6, '#41b6c4', 0.8, '#1d91c0', 0.9, '#225ea8', 1.0, '#0c2c84'],
                'fill-outline-color': '#2d2a3f',
                'fill-opacity': 0.7
            }
        });

        //console.log("colorNeighborhoods called for the first time");
        map.on('mousemove', layerId, function (e) {
            updateInfoBoxScores(e.features[0].properties.region_name, e.features[0].properties.score);
        });
        layerApplied[layerId] = true;
    }
    else {
        //console.log("Recoloring Neighborhoods");
        var totalData = {"type": "FeatureCollection", "features": []};
        for (var regionId in psData) {
            if (psData[regionId]["neighborhood"]["data"] != null) {
                totalData.features.push(psData[regionId]["neighborhood"]["data"]);
            }
        }
        // console.log("Please re check" + JSON.stringify(totalData));
        map.getSource('as-polygons').setData(totalData);
    }
}

function displayAverageScore() {
    document.getElementById("average-info").innerHTML = "Average score <span>" + parseFloat(avgScore) + "</span>";
}

function calculateAverageScore() {
    console.log("Calculating Average Score");
    var total = 0;
    var count = 0; //Object.keys(psData).length;
    for (var regionId_i in psData) {
        if (psData[regionId_i]["neighborhood"]["data"] &&
            psData[regionId_i]["neighborhood"]["data"]["properties"]["score"]) {
            total += round(psData[regionId_i]["neighborhood"]["data"]["properties"]["score"], 1);
            count += 1;
        }
    }
    avgScore = round(total * 100 / count, 1);
}

function updateInfoBoxScores(name, score) {
    var regionName = name;
    var regionScore = score;

    document.getElementById("info-panel-instruction").innerHTML = "Showing information for the selected area";
    document.getElementById("region-name").innerHTML = regionName;
    if (score !== null) {
        document.getElementById("access-score").innerHTML = round(regionScore * 100, 1);
    } else {
        document.getElementById("access-score").innerHTML = "NA";
    }
}

function plotMax5Charts(response) {

    if (response.features.length === 0) {
        document.getElementById("top-5-graph").innerHTML = "";
        document.getElementById("container1").style.display = "none";
        return;
    }
    document.getElementById("container1").style.display = "block";
    var number = 0;
    var data = [];
    var namesArray = [];
    console.log("Plotting 5 charts");
    if (response.features.length > 5) {
        number = 5;
    } else {
        number = response.features.length;
    }
    console.log("number = " + number);
    var possibilities = [];
    for (var i = 0; i < response.features.length; i++) {
        possibilities.push(response.features[i].properties.score);
    }
    var valuesArray = possibilities.slice(0).sort().reverse();
    var shorterList = [];
    for (var i = 0; i < number; i++) {
        shorterList.push(valuesArray[i]);
    }
    valuesArray = shorterList.slice(0).sort();
    for (var i = 0; i < number; i++) {
        for (var j = 0; j < response.features.length; j++) {
            if (response.features[j].properties.score === valuesArray[i]) {
                namesArray.push(response.features[j].properties.region_name);
            }
        }
    }

    for (var i = 0; i < number; i++) {
        var json = {"Region_name": namesArray[i], "data": parseFloat(valuesArray[i]) * 100};
        //var result = '"{Region_name":'+ namesArray[i] + ',' + '"data":' + parseFloat(valuesArray[i]) + '},';
        //JSONString += result;
        data.push(json);
    }

    document.getElementById("top-5-graph").innerHTML = "";
    var fullWidth = 200;
    var fullHeight = 150;
    var svg = d3.select("#top-5-graph"),
        margin = {top: 20, right: 20, bottom: 30, left: 40},
        width = fullWidth - margin.left - margin.right,
        height = fullHeight - margin.top - margin.bottom;

    var x = d3.scaleLinear().range([0, width]),
        y = d3.scaleBand().range([height, 0]).padding(0.1),
        colorScale = d3.scaleThreshold().domain([0, 20, 40, 60, 80, 90, 100]) //d3.scaleOrdinal(d3.schemeCategory10);
            .range(["#ffffcc", "#c7e9b4", "#7fcdbb", "#41b6c4", "#1d91c0", "#225ea8"]);

    var tooltip = d3.select("#tooltip");
    var g = svg.append("g")
        .attr("transform", "translate(" + (margin.left * 2 + 40) + "," + margin.top + ")");

    data.forEach(function (d) {
        d.data = +d.data;
    });

    x.domain([0, d3.max(data, function (d) {
        return d.data;
    })]);
    y.domain(data.map(function (d) {
        return d.Region_name;
    }));
    colorScale.domain(data.map(function (d) {
        return d.Region_name;
    }));
    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.5em")
        .attr("dy", "0.1em")
        .attr("transform", function (d) {
            return "rotate(-45)"
        });

    g.append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(y))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "0.4em")
        .attr("dy", "-0.30em")
        .attr("transform", function (d) {
            return "rotate(-30)"
        });

    g.append("text")
        .attr("transform",
            "translate(" + (width / 2) + " ," +
            (height + margin.top + 20) + ")")
        .style("text-anchor", "middle")
        .text("Access Score");

    var k = g.selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", function (d) {
            return 2;
        })
        .attr("y", function (d) {
            return y(d.Region_name);
        })
        .attr("width", function (d) {
            return x(d.data);
        })
        .attr("padding", "5px")
        .attr("height", y.bandwidth())
        .style("fill", function (d) {
            // alert("d.data = " + d.data);
            //alert("color = " + colorScale(d.data));
            var valueToCode = d.data;
            if (valueToCode >= 0 && valueToCode <= 20) {
                //alert("Value between 0 and 20");
                return "#f7f78f";
            } else if (valueToCode <= 40) {
                //alert("Value between 20 and 40");
                return "#c7e9b4";
            } else if (valueToCode <= 60) {
                //alert("Value between 40 and 60");
                return "#7fcdbb";
            } else if (valueToCode <= 80) {
                //alert("Value between 60 and 80");
                return "#41b6c4";
            } else if (valueToCode <= 90) {
                //alert("Value between 80 and 90");
                return "#1d91c0";
            } else {
                //alert("Value between 90 and 100");
                return "#225ea8";
            }
            //return colorScale(d.data);
        })
        .style("border", "20px solid black")
        .on("mousemove", function (d) {
            tooltip
                .style("left", 175 + "px")
                .style("top", (d3.event.pageY - 50) + "px")
                .classed('hidden', false)
                .html((d.Region_name) + "<br>" + (round(d.data, 1)));
        })
        .on("mouseleave", function () {
            tooltip.classed('hidden', true);
        });

    document.getElementById("heading1").innerText = "Top 5 accessible regions";
}

function makeHistogram() {
    console.log("Calling makeHistogram");
    document.getElementById("histogram-holder").innerHTML = "";
    document.getElementById("container2").style.display = "block";
    console.log("Came to make histogram");
    var fullWidth = 250;
    var fullHeight = 150;
    var svg = d3.select("#histogram-holder"),
        margin = {top: 10, right: 30, bottom: 30, left: 30},
        width = fullWidth - margin.left - margin.right,
        height = fullHeight - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    var data = [];
    for (var regionId in psData) {
        if (psData[regionId]["neighborhood"]["data"] !== null && psData[regionId]["neighborhood"]["data"] !== undefined) {
            if (psData[regionId]["neighborhood"]["data"]["properties"]) {
                var dataStored = psData[regionId]["neighborhood"]["data"]["properties"]["score"];
                data.push(Math.round(dataStored * 100));
            }
        }
    }

    var formatCount = d3.format(",.0f");
    console.log("data array = " + data);
    var x = d3.scaleLinear()
        .rangeRound([0, width])
        .domain([0, 110]);
    console.log("ticks = " + x.ticks(10));

    var bins = d3.histogram()
        .domain([0, 100])
        .thresholds(x.ticks(10))
        (data);

    var y = d3.scaleLinear()
        .domain([0, d3.max(bins, function (d) {
            return d.length;
        })])
        .range([height, 0]);

    var bar = g.selectAll(".bar")
        .data(bins)
        .enter().append("g")
        .attr("class", "bar")
        .attr("transform", function (d) {
            return "translate(" + x(d.x0) + "," + y(d.length) + ")";
        });

    g.append("text")
        .attr("transform",
            "translate(" + (width / 2) + " ," +
            (height + margin.top + 20) + ")")
        .style("text-anchor", "middle")
        .text("Access Score");

    bar.append("rect")
        .attr("x", 0)
        .attr("width", x(bins[0].x1) - x(bins[0].x0))
        .attr("height", function (d) {
            return height - y(d.length);
        });

    bar.append("text")
        .attr("dy", ".75em")
        .attr("y", -10)
        .attr("x", (x(bins[0].x1) - x(bins[0].x0)) / 2)
        .attr("text-anchor", "middle")
        .text(function (d) {
            // console.log("Returning value of text = " + formatCount(d.length));
            return formatCount(d.length);
        });

    g.append("g")
        .attr("class", "axis axis--x")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));
    document.getElementById("heading2").innerText = "Histogram of Access Scores";

}

/* 
    Transitioning and changing their circles (and toggling between different views)
    Source: https://github.com/jorditost/mapboxgl-d3-playground/blob/master/05-toggle-views.html

    Some of the functions might be useful when animating transitions from streets
    to dots and back - not yet sure
*/
function update(transitionTime) {
    // Default value = 0
    transitionTime = (typeof transitionTime !== 'undefined') ? transitionTime : 0;
    // Map view
    if (view === "map") {
        svgOuter.selectAll("circle")
            .transition()
            .duration(transitionTime)
            .attr("cx", function (d) {
                return project(d.geometry.coordinates).x
            })
            .attr("cy", function (d) {
                return project(d.geometry.coordinates).y
            });
        // Grid view
    } else if (view === "grid") {
        var ix = 0,
            iy = 0,
            rows = 3,
            cols = 3;
        // Check window with and height
        var windowWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
            windowHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        var gridItemWidth = (windowWidth * 0.8) / (cols + 1);
        var gridItemHeight = (windowHeight) / (rows + 1);
        svgOuter.selectAll("circle").each(function (d) {
            var circle = d3.select(this);
            console.log("ix: " + ix + ", iy: " + iy);
            circle
                .transition()
                .duration(transitionTime)
                .attr("cx", function (d) {
                    return (windowWidth * 0.2) + (ix * gridItemWidth) + (0.5 * gridItemWidth);
                })
                .attr("cy", function (d) {
                    return (iy * gridItemHeight) + gridItemHeight;
                });
            // Increase iterators
            ix++;
            if (ix === cols) {
                ix = 0;
                iy++;
            }
            if (iy === rows) {
                iy = 0;
            }
        });
    }
}