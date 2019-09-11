import React, { Component } from "react";
import ReactDOM from "react-dom";
import L from "leaflet";

export default class LegendControl extends Component {
  componentWillMount() {
    
  }

  render() {
    return <div>{this.leafletElement}</div>;
  }
}
