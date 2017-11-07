import React, { Component } from 'react'
import './App.css'
import * as d3 from 'd3'

var linePattern = {arrivals:"2, 4, 1, 2", waiting:"2,2", lwbs:"1,1", simulation:"4,1" };
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
    .range([0, this.props.size[1]]);

    var  y = d3.scaleLinear()
    .domain([0, 25])
    .range([height,0]);

    var x = d3.scaleLinear()
    .domain([0, 168])
    .range([0, width]);

    var z = d3.scaleOrdinal(d3.schemeCategory10);

    var yAxisLeft = d3.axisLeft().scale(y)
    .ticks(5);

    d3.select(g)
    .selectAll("g").remove();


    d3.select(g)
    .selectAll("g.axisx")
    .data([0])
    .enter()
    .append("g")
    .attr("class",  "axis axis--x")
    .call(d3.axisLeft(y));

    d3.select(g)
    .selectAll("g.axisy")
    .data([0])
    .enter()
    .append("g").append("g")
    .attr("class", "axis axis--y")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(daysOfWeek));

//for each data set, get the name, data, and line array
var allData = this.props.data[this.props.site];
Object.keys(allData).map(function(key){
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
