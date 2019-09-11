import React, { Component } from "react";
import MapComponent from "./MapComponent";

class ControlPanel extends Component {
  state = {};

  componentDidMount() {}

  render() {
    return (
      <div style={{ justifyContent: "flex-end" }}>
        <MapComponent />
      </div>
    );
  }
}

export default ControlPanel;
