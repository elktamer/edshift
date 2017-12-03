import React, { Component } from 'react'
import './App.css'
import * as d3 from 'd3'

//TODO: should doctorSupply be squared lines?
var linePattern = {arrivals:"2, 4, 1, 2", waiting:"", lwbs:"1,1", simulation:"1,1", supply:"3,3,1,1",
 treated: "2,2", measuredRate:"1,4"};
class WeekChart extends Component {
  constructor(props){
    super(props)
    this.createWeekChart = this.createWeekChart.bind(this)
  }

  componentDidMount() {
    this.createWeekChart()
  }

  componentDidUpdate() {
    this.createWeekChart()
  }
  //todo:
  //indicate which location is active
  //indicate which datatypes to display; send an array of the ones to display then loop through that list
  //indicate which derived data to display; create a new javascript object for the derived calculations, then treat
  // them like the other datatypes

  createWeekChart() {
    const g = this.node;
    if( typeof this.props.data.RGH === "undefined"){
      return null;
    }

    const height = this.props.size[1];
    const width = this.props.size[0];

    var daysOfWeek = d3.scaleBand()
    .domain(["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday","Friday","Saturday"])
    .range([0, this.props.size[0]]);

    var  y = d3.scaleLinear()
    .domain([-2,10])
    .range([height-30,30]);

    var x = d3.scaleLinear()
    .domain([0, 168])
    .range([30, width]);

    var z = d3.scaleOrdinal(d3.schemeCategory10);

    d3.select(g)
    .selectAll("g").remove();


    d3.select(g)
    .selectAll("g.axisy")
    .data([0])
    .enter()
    .append("g")
    .attr("class",  "axis axis--y")
    .attr("transform", "translate(30," +0 + ")")

    .call(d3.axisLeft(y));

    d3.select(g)
    .selectAll("g.axisx")
    .data([0])
    .enter()
    .append("g").append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(30," + (height-30) + ")")
    .call(d3.axisBottom(daysOfWeek));

//for each data set, get the name, data, and line array
var allData = this.props.data[this.props.site];
var show =  this.props.show;
Object.keys(allData).forEach(function(key){
  if( show[key])
    drawLine(  d3.select(g), key, allData[key], linePattern[key], x, y, z)
});
  }

  render() {
    return <svg ref={node => this.node = node} width={this.props.size[0]} height={this.props.size[1]}>
    </svg>
  }
}

function drawLine( g,  name, data, pattern, x, y, z){
  g.selectAll(name)
  .data([0])
  .enter()
  .append("g").selectAll("."+name)
  .data(data)
  .enter().append("g")
  .attr("class", "name")
  .append("path")
  .attr("class", "line")
  .style("stroke", function(d, i) { return z(i); })
  .style("stroke-dasharray", (pattern))
  .attr("d", d3.line()
  .x(function(d, i) {
    return x(i);
  })
  .y(function(d) {
    return y(d);
  }));
}
export default WeekChart
