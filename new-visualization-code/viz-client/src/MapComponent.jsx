import React from "react";
import ReactDOM from "react-dom";
import L from "leaflet";
import ndjsonStream from "can-ndjson-stream";
import * as turf from "@turf/turf";

import dcBounds from "./dc-boundary";

const LegendControl = React.memo(function LegendControl(props) {
  const jsx = <div {...props}>{props.children}</div>;
  L.Control.legend = L.Control.extend({
    onAdd: function(map) {
      this._div = L.DomUtil.create("div", "mainMenu");
      L.DomEvent.disableClickPropagation(this._div).disableScrollPropagation(
        this._div
      );
      ReactDOM.render(jsx, this._div);
      return this._div;
    },

    onRemove: function(map) {
      //Nothing to do here
    }
  });
  //const legend = L.Control.extend({ position: "bottomleft" });

  L.control.legend = function(opts) {
    return new L.Control.legend(opts);
  };
  if (props.map !== null) {
    L.control.legend({ position: "topright" }).addTo(props.map);
  }
  return <div></div>;
});

class MapComponent extends React.Component {
  state = {
    points: [],
    map: null
  };

  async fetchNdjson() {
    fetch("http://localhost:5555/api") // make a fetch request to a NDJSON stream service
      .then(response => {
        return ndjsonStream(response.body); //ndjsonStream parses the response.body
      })
      .then(exampleStream => {
        const reader = exampleStream.getReader();
        let read;
        reader.read().then(
          (read = result => {
            if (result.done) {
              //get geojson and set to state
              this.setState({ points: this.geojson.toGeoJSON() });
              return;
            }
            //load point by point onto map
            const point = result.value; //returns a geojson object

            //addition parsing
            /*if(point["properties"]["Labey Type"] === "CurbRamp"){
              point["properties"]["value"] = 0;
            } else {
              point["properties"]["value"] = 1;
            }*/
            console.log(point);
            this.geojson.addData(point);
            reader.read().then(read);
          })
        );
      });
  }

  componentWillMount() {}

  componentDidMount() {
    // create map
    var southWest = L.latLng(38.794, -77.14),
      northEast = L.latLng(38.997, -76.891),
      cityBounds = L.latLngBounds(southWest, northEast);

    this.map = L.map("map", {
      center: [-77.039, 38.897],
      zoom: 2,
      maxZoom: 16,
      preferCanvas: true,
      layers: [
        L.tileLayer(
          "https://api.mapbox.com/styles/v1/manaswi/{id}/tiles/256/{z}/{x}/{y}?access_token={accessToken}",
          {
            attribution:
              'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            id: "cjtub9evh13m91fp3bo9zbvy2",
            accessToken:
              "pk.eyJ1IjoibWFuYXN3aSIsImEiOiJjamg5c2hmZ2swZnpvMzhxZ28wcmhvb2NwIn0.MYu7KmIcoYH8k78mQh7wWA",
            updateWhenZooming: false,
            updateWhenIdle: true
          }
        )
      ]
    });
    function getColor(feature) {
      switch (feature["properties"]["Labey Type"]) {
        case "CurbRamp":
          return "#8fc194";
        case "Problem":
          return "#D8514B"; //"#e25b5b",
        case "NoCurbRamp":
          return "#e7298a";
        case "SurfaceProblem":
          return "#f36c10";
        case "Obstacle":
          return "#6592d6";
        default:
          return "#FFF";
      }
    }

    this.geojson = L.geoJSON([], {
      pointToLayer: function(feature, latlng) {
        return L.circleMarker(latlng, {
          radius: 2,
          fillColor: getColor(feature),
          color: "#fff",
          weight: 0.5,
          opacity: 1,
          fillOpacity: 0.8
        });
      }
    }).addTo(this.map);

    //begin fetching data async
    this.fetchNdjson();

    //meanwhile fit the map to the city bounds
    this.map.fitBounds(cityBounds);
    this.setState({ map: this.map });
  }

  //generates the grid visualization
  gridMapViz = () => {
    //parameters to change for grid aggregation

    if (this.state.map) {
      var b = this.state.map.getBounds();
      var extend = [
        b.getSouthWest().lng,
        b.getSouthWest().lat,
        b.getNorthEast().lng,
        b.getNorthEast().lat
      ];

      //grid layer creation
      var sidewalkGridStyle = {
        style: function style(feature) {
          return {
            weight: 2,
            //fillColor: getColor(feature.properties.z),
            opacity: 1,
            color: "white",
            fillOpacity: 0.7
          };
        }
      };

      var dcLayer = L.geoJSON(dcBounds).addTo(this.state.map);

      //GRID
      var bbox = dcLayer
        .getBounds()
        .toBBoxString()
        .split(",")
        .map(Number);
      console.log(bbox);
      var cellSide = 0.5;
      var mask = dcLayer.toGeoJSON().features[0];
      console.log(mask);
      var units = "kilometers";
      var options = {
        units: units
      };

      var grid = turf.squareGrid(bbox, cellSide, options);
      console.log(grid);
      console.log("finished generating grid, loading onto map");
      var gridLayer = L.geoJson(grid, sidewalkGridStyle).addTo(this.state.map);

      var count = turf.collect(grid);

      /*
      //polygon to mask the turf grid
      const dcPolygon = turf.polygon(
        dcBounds.features[0].geometry["coordinates"]
      );
      console.log(dcPolygon);
       

      //settings
      const cellWidth = 1;
      const units = "kilometers";
      const bbox = turf.bbox(dcBounds);

      //generating the squareGrid
      const squareGrid = turf.squareGrid(bbox, cellWidth, units, {
        mask: dcBounds
      });

      //adding to the map stored in state
      L.geoJson(squareGrid, sidewalkGridStyle).addTo(this.state.map);
       */
    }
  };

  render() {
    console.log(this.state.points);
    return (
      <div id="map">
        <LegendControl className="supportLegend" map={this.state.map}>
          <h1>This is a Test</h1>
          <button onClick={this.gridMapViz}>Show Grid Viz</button>
        </LegendControl>
      </div>
    );
  }
}

export default MapComponent;
