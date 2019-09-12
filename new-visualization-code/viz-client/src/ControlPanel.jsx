import React, { Component } from "react";
import MapComponent from "./MapComponent";

class ControlPanel extends Component {
  state = {};

  componentDidMount() {}

  render() {
    return (
      <div style={{ justifyContent: "flex-end" }}>
        <MapComponent clustered={true} excludecurbs={true} />
      </div>
    );
  }
}

export default ControlPanel;
