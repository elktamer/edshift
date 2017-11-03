import React, { Component } from 'react'
import './App.css'
import * as d3 from 'd3'


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
    const dataCheck = this.props.data;
    const height = this.props.size[0];
    const width = this.props.size[1];
    var daysOfWeek = d3.scaleBand()
    .domain(["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday","Friday","Saturday"])
    .range([0, this.props.size[1]]);
    var  y = d3.scaleLinear()
    .domain([0, 25])
    .range([height, 0]);
    var x = d3.scaleLinear()
    .domain([0, 168])
    .range([0, width]);
    var z = d3.scaleOrdinal(d3.schemeCategory10);


    var yAxisLeft = d3.axisLeft().scale(y)
    .ticks(5);

    d3.select(g)
    .selectAll("g.axisy")
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
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(daysOfWeek));

    var serie =d3.select(g)
    .selectAll("g.axisy")
    .data([0])
    .enter()
    .append("g").selectAll(".serie")
    .data([0])
    .enter().append("g")
    .attr("class", "serie")
    .append("path")
    .attr("class", "line")
    .style("stroke", function(d, i) { return z(i); })
    .attr("d", d3.line()
    .x(function(d, i) {
      return x(i);
    })
    .y(function(d) {
      return y(d);
    }));

  }

  render() {
    return <svg ref={node => this.node = node} width={this.props.size[0]} height={this.props.size[1]}>
    </svg>
  }
}

export default WeekChart
