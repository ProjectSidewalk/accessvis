const dcBounds = {
  type: "FeatureCollection",
  properties: { kind: "state", state: "DC" },
  features: [
    {
      type: "Feature",
      properties: { kind: "county", name: "District of Columbia", state: "DC" },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          [
            [
              //north corner
              [-77.0410235, 38.9958524],
              //midway of NE boundary
              [-77.0024, 38.9665],
              //east corner
              [-76.909366,38.8928623],
              //south corner
              [-77.0407, 38.7912],
              //concave edge of SW boundary
              [-77.0462, 38.8405],
              //midway of SW boundary
              [-77.0407, 38.8734],
              //west corner
              [-77.1174, 38.9336]
            ]
          ]
        ]
      }
    }
  ]
};

export default dcBounds;
