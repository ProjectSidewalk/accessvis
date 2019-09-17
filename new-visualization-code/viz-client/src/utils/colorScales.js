//to introduce a new scale, add it as a constant below in the defined format
/*
const <name of scale> = {
  colors: [
    {val: <some delimiter>, color: '<some color>'},
  ],
  properties: [
    <list of property objects>
  ]
}
*/

//AccessViz scale
const orangeRedScale = {
  colors: [
    { val: 50, color: "#BD1527" },
    { val: 30, color: "#F03B20" },
    { val: 20, color: "#FE8D3A" },
    { val: 15, color: "#FFB24B" },
    { val: 10, color: "#FED975" },
    { val: 5, color: "#FFFFB3" },
    { val: 0, color: "#FFFFFF" }
  ],
  properties: []
};

//Curb Ramp scale
const greenScale = {
  colors: [
    { val: 50, color: "#116837" },
    { val: 30, color: "#31A353" },
    { val: 20, color: "#77C679" },
    { val: 15, color: "#ADDD8E" },
    { val: 10, color: "#DAF0A3" },
    { val: 5, color: "#FFFFCC" },
    { val: 0, color: "#FFFFFF" }
  ],
  properties: []
};

//Custom-defined scale
const customJohnsonScale = {
  colors: [
    { val: 50, color: "#800026" },
    { val: 30, color: "#BD0026" },
    { val: 20, color: "#E31A1C" },
    { val: 15, color: "#FC4E2A" },
    { val: 10, color: "#FD8D3C" },
    { val: 5, color: "#FEB24C" },
    { val: 0, color: "#FFFFFF" }
  ],
  properties: []
};

export default { orangeRedScale, greenScale, customJohnsonScale };
