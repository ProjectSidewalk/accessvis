import React from "react";
import ReactDOM from "react-dom";
import L from "leaflet";
import ndjsonStream from "can-ndjson-stream";
import squareGrid from '@turf/square-grid';
import collect from '@turf/collect';
import pointsWithinPolygon from '@turf/points-within-polygon'

import dcBounds from "./dc-boundary";
import querySidwalkData from "./utils/querySidewalkData";

const LegendControl = function LegendControl(props) {  
  if(props.pointsload){    
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
    return <div></div>;} else {
      return <div></div>
    }
};

class MapComponent extends React.Component {
  state = {
    points: [],
    map: null,
    pointsLoad: false,
    gridVizOn: false,
  };

  async fetchNdjson() {
    if(this.props.clustered){
      if(this.props.excludecurbs){
        console.log("exclude curbs");
        querySidwalkData(3);
      } else {
        console.log("don't exclude curbs");
        querySidwalkData();
      }
    } else {
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
              this.setState({ points: this.geojson.toGeoJSON(), pointsLoad: true });
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
      switch (feature["properties"]["Label Type"]) {
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

    this.pane1 = this.map.createPane('points');
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
    })

    this.pointLayer.addLayer(this.geojson);
    this.map.addLayer(this.pointLayer);

    //begin fetching data async
    this.fetchNdjson();

    //meanwhile fit the map to the city bounds
    this.map.fitBounds(cityBounds);
    this.setState({ map: this.map });
  }

  //generates the grid visualization
  gridMapViz = () => {
    //parameters to change for grid aggregation
    function getColor(d) {        
      return d > 100 ? '#800026' :
             d > 50  ? '#BD0026' :
             d > 40  ? '#E31A1C' :
             d > 30  ? '#FC4E2A' :
             d > 20   ? '#FD8D3C' :
             d > 10   ? '#FEB24C' :
             d == 0  ? '#FFFFFF' :
                        '#FFEDA0';      
    }

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
            fillColor: getColor(feature.properties.pointCount),
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
        const pointCount = pointsWithinPolygon(this.state.points, feature).features.length;
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
      

      //this will probably break the code
      this.setState({gridVizOn: true, pointsLoad: false});
    }
  };

  handleTest = () => {
    querySidwalkData();
  }

  render() {    
    return (
      <div id="map">
        <LegendControl className="supportLegend" map={this.state.map} pointsload={this.state.pointsLoad}>
          <h1>This is a Test</h1>
          <button id="gridViz" disabled={this.state.gridVizOn} onClick={this.gridMapViz}>Show Grid Viz</button>
          <button id="retrieveSideWalkData" onClick={this.handleTest}>Get Sidewalk Data</button>
        </LegendControl>
      </div>
    );
  }
}

export default MapComponent;
