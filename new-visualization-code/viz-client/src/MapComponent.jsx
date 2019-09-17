import React from "react";
import ReactDOM from "react-dom";
import L from "leaflet";
import ndjsonStream from "can-ndjson-stream";
import squareGrid from "@turf/square-grid";
import pointsWithinPolygon from "@turf/points-within-polygon";
import "bootstrap/dist/css/bootstrap.css";

import dcBounds from "./utils/dc-boundary";
import colorScales from "./utils/colorScales";

const LegendControl = function LegendControl(props) {
  //this will be called on every setstate
  //add renderGridLegend here
  if (props.gridon) {
    const jsx = (
      <div className="container">
        {colorScales.orangeRedScale.colors.map((obj, index) => {
          return (
            <div className="row" key={index}>
              <div className="col">{obj.val}:</div>
              {/*This approach below is not mobile friendly */}
              <div className="col">
                <div
                  style={{
                    height: "15px",
                    width: "15px",
                    backgroundColor: obj.color
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    );
    ReactDOM.render(jsx, document.getElementById("colorLegend"));
  }

  if (props.pointsload) {
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
  } else {
    return <div></div>;
  }
};

class MapComponent extends React.Component {
  state = {
    points: [],
    map: null,
    pointsLoad: false,
    gridVizOn: false
  };

  async fetchNdjson() {
    if (this.props.clustered) {
      const lat1 = 38.794,
        lng1 = -77.14,
        lat2 = 38.997,
        lng2 = -76.891;
      //const lat1 = 38.884832, lng1 = -77.026726, lat2 = 38.882803, lng2 = -77.023405;
      const url =
        "https://sidewalk-dc.cs.washington.edu/v2/access/attributes?lat1=" +
        lat1 +
        "&lng1=" +
        lng1 +
        "&lat2=" +
        lat2 +
        "&lng2=" +
        lng2;
      fetch(url)
        .then(response => {
          return response.json();
        })
        .then(data => {
          if (this.props.excludecurbs) {
            //watch out: query returns property as label_type
            //excludes curbRamps
            data.features = data.features.filter(function(feature) {
              return (
                feature.properties["label_type"] !== "CurbRamp" &&
                feature.properties["label_type"] !== "NoSidewalk"
              );
            });
            console.log(data);
          }
          return data;
        })
        .then(data => {
          this.geojson.addData(data);
          this.setState({ points: data, pointsLoad: true });
        });
    } else {
      //local data
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
                this.setState({
                  points: this.geojson.toGeoJSON(),
                  pointsLoad: true
                });
                return;
              }
              //load point by point onto map
              const point = result.value; //returns a geojson object
              console.log(point);
              this.geojson.addData(point);
              reader.read().then(read);
            })
          );
        });
    }
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
      switch (feature["properties"]["label_type"]) {
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
        case "Occlusion":
          //find color for occlusion
          return "#FF0000";
        default:
          console.log(feature);
          return "#FFF";
      }
    }

    this.pointLayer = new L.FeatureGroup();

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
    });

    this.pointLayer.addLayer(this.geojson);
    this.map.addLayer(this.pointLayer);

    //begin fetching data async
    this.fetchNdjson();

    //meanwhile fit the map to the city bounds
    this.map.fitBounds(cityBounds);
    this.setState({ map: this.map });
  }

  gridMapViz = () => {
    //generates the grid visualization
    //modularized getColor
    const getColor = (d, colorScales) => {
      const orangeRedScale = colorScales;
      const { colors } = orangeRedScale;
      console.log(colors);
      for (const color of colors) {
        if (d > color.val) {
          return color.color;
        }
      }
    };

    if (this.state.map) {
      //grid layer creation
      var sidewalkGridStyle = {
        style: function style(feature) {
          return {
            weight: 0, //2
            fillColor: getColor(feature.properties.pointCount, colorScales),
            opacity: 0, //1
            color: "white",
            fillOpacity: feature.properties.pointCount > 0 ? 0.9 : 0
          };
        }
      };

      var dcLayer = L.geoJSON(dcBounds);

      //GRID
      var bbox = dcLayer
        .getBounds()
        .toBBoxString()
        .split(",")
        .map(Number);
      var cellSide = 0.25;
      var mask = dcBounds.features[0];
      var units = "kilometers";
      var options = {
        units: units,
        mask: mask
      };

      var grid = squareGrid(bbox, cellSide, options);
      console.log(grid);
      console.log("finished generating grid, loading onto map");
      const len = grid.features.length;
      grid.features.forEach((feature, index) => {
        const pointCount = pointsWithinPolygon(this.state.points, feature)
          .features.length;
        console.log(feature, index, "/", len, "point count = ", pointCount);
        feature.properties["pointCount"] = pointCount;
      });

      console.log(grid);
      L.geoJSON(grid, sidewalkGridStyle).addTo(this.state.map);
      console.log("finished adding grid");

      //get the gridViz button and disable it to prevent more grids from being added
      /*const button = document.getElementById("gridViz");
      button.disabled = true;*/

      //remove the points layer

      //save the state
      this.setState({ gridVizOn: true, pointsLoad: false });
    }
  };

  render() {
    return (
      <div id="map">
        <LegendControl
          className="supportLegend"
          map={this.state.map}
          pointsload={this.state.pointsLoad}
          gridon={this.state.gridVizOn}
        >
          <h1>This is a Test</h1>
          <button
            id="gridViz"
            disabled={this.state.gridVizOn}
            onClick={this.gridMapViz}
          >
            Show Grid Viz
          </button>
          <div id="colorLegend"></div>
        </LegendControl>
      </div>
    );
  }
}

export default MapComponent;
