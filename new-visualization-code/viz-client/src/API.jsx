import React, { Component } from 'react';
import axios from 'axios';
import ndjsonStream from 'can-ndjson-stream';
import mapboxgl from 'mapbox-gl';
import { Map, TileLayer, Reactangle } from 'react-leaflet';

const style = {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '100%'
  };

const point = {
    backgroundImage: `url`
}

class API extends Component {
    constructor() {
        super();
        this.state = {
            features: [],
        };
    }

    async getDataAxios(){
        const response =
          await axios.get("http://localhost:5555/data");
        return response;
    }

    async fetchNdjson(map){
        fetch( "http://localhost:5555/api" )  // make a fetch request to a NDJSON stream service
        .then( ( response ) => {
            return ndjsonStream( response.body ); //ndjsonStream parses the response.body
    
        } ).then( ( exampleStream ) => {
            const reader = exampleStream.getReader();
            let read;
            reader.read().then( read = ( result ) => {
                if ( result.done ) {
                    return;
                }
                //load point by point onto map
                const point = result.value; //{Audit Task Id: "303", Label Id: "1973", Label Type: "Obstacle", Lat: "38.91589282", Lng: "-76.98477341", …}Audit Task Id: "303"Canvas X: "283"Canvas Y: "246"Deleted: "FALSE"Description: "Obstacle in a Path"Description (Problem Description): nullGeom: "0101000020E610000050A40987063F53C04B82DFF93B754340"Gsv Panorama Id: "0v5blsj4UYIBgScC6TK7Rg"Heading: "47.25"Label Id: "1973"Label Point Id: "1958"Label Type: "Obstacle"Lat: "38.91589282"Lng: "-76.98477341"Panorama Lat: "38.91579437"Panorama Lng: "-76.98487091"Photographer Heading: "246.4900055"Photographer Pitch: "-0.722464621"Pitch: "-10.6875"Problem Description Id: nullSeverity: nullSv Image X: "1393", Sv Image Y: "-423"}
                console.log(point);
                //generate points on map
                /*map.addLayer({
                    "id": "points",
                    "type": "symbol",
                    "source": {
                        "type": "geojson",
                        "data": "FeatureCollection",
                        "features": [{
                            "type":"Feature",
                            "geometry": {
                                "type": "Point",
                                "coordinates": [point.Lng, point.Lat]
                            },
                            "properties": {
                                "title": point["Label Type"],
                                "icon": ""
                            }
                        }]
                    }
                })*/
                 
                        const colors = {
                            "CurbRamp": "#8fc194",
                            "Problem": "#D8514B", //"#e25b5b",
                            "NoCurbRamp": "#e7298a",
                            "SurfaceProblem": "#f36c10",
                            "Obstacle": "#6592d6"
                        }
                 
                        // Curb Ramp Layer (aka No problem)
                        map.addLayer({
                            "id": "points",
                            "source": {
                                "type": "geojson",
                                "data": [{
                                    "type":"Feature",
                                    "geometry": {
                                        "type": "Point",
                                        "coordinates": [point.Lng, point.Lat]
                                    },
                                    "properties": {
                                        "title": point["Label Type"],
                                    }
                                }]
                            },
                            "type": "circle",
                            "paint": {
                                "circle-radius": 3,
                                "circle-color": colors[point["Label Type"]],
                                "circle-opacity": 0.4
                            },
                            "filter": ["all",
                                        ["==", "Label Type", point["Label Type"]],
                                        // [">=", "Severity", "4.0"],
                                        // ["==", "Region Id", "231"]                
                                    ]
                        });
                 
                        /*
                        // Problem Layer
                        map.addLayer({
                            "id": "problempoints",
                            "source":  "labels",
                            "type": "circle",
                            "paint": {
                                "circle-radius": 3,
                                "circle-color": "#e34a33",
                                "circle-opacity": 0.7,
                 
                                // make circles larger as the user zooms from z12 to z22
                                // 'circle-radius': {
                                //     'base': 1.75,
                                //     'stops': [[12, 2], [22, 180]]
                                // },
                 
                                // color circles by severity, using a match expression
                                // https://www.mapbox.com/mapbox-gl-js/style-spec/#expressions-match
                                 
                                // 'circle-color': [
                                //     'match',
                                //     ['get', 'Severity'],
                                //     '1.0', '#ffffcc',
                                //     '2.0', '#a1dab4',
                                //     '3.0', '#41b6c4',
                                //     '4.0', '#2c7fb8',
                                //     '5.0', '#253494',
                                //     //other  '#ccc'
                                // ]
                                 
                                // 'circle-color': {
                                //     property: 'sqrt',
                                //     stops: [
                                //         [0, '#f1f075'],
                                //         [250, '#e55e5e']
                                //    ]
                                // }
                                 
                            },
                            "filter": ["all",
                                        ["==", "Label Type", "CurbRamp"],
                                        // ["==", "Region Id", "231"]
                                    ]
                        });*/
                reader.read().then( read );
    
            } );
        } );
    }


    componentDidMount() {
        mapboxgl.accessToken = 'pk.eyJ1IjoibWFuYXN3aSIsImEiOiJjamg5c2hmZ2swZnpvMzhxZ28wcmhvb2NwIn0.MYu7KmIcoYH8k78mQh7wWA';

        var southWest = new mapboxgl.LngLat(-77.140, 38.794),
        northEast = new mapboxgl.LngLat(-76.891, 38.997),
        cityBounds = new mapboxgl.LngLatBounds(southWest, northEast);

      this.map = new mapboxgl.Map({
        container: this.mapContainer,
        style: 'mapbox://styles/manaswi/cjtub9evh13m91fp3bo9zbvy2',
        center: [-77.039, 38.897],
        zoom: 2,
        maxZoom: 16
      });
      this.fetchNdjson(this.map);

      this.map.fitBounds(cityBounds);
    }

    componentWillUnmount() {
        this.map.remove();
      }

    state = {  }
    render() { 
        return ( 
            <div style={style} ref={el => this.mapContainer = el} />
         );
    }
}
 
export default API;