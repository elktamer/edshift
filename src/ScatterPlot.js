import React, { Component } from 'react'
import './App.css'

import * as d3 from 'd3'
//TODO: convert the queue length into waiting time. How?
// maybe by tracking time in the simulation
//display the probability distribution and associated info using d3

//TODO: show both ctas2 and ctas3 data at the same time
class ScatterPlot extends Component {
  constructor(props){
    super(props)
    this.createScatterPlot = this.createScatterPlot.bind(this)
  }

  componentDidMount() {
    this.createScatterPlot()
  }

  componentDidUpdate() {
    this.createScatterPlot()
  }

  createScatterPlot() {
    const node = this.node

    var margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = this.props.size[0] - margin.left - margin.right,
    height = this.props.size[1] - margin.top - margin.bottom;


    var x = d3.scaleLinear()
    .rangeRound([margin.left, width]);
    var y = d3.scaleLinear().range([height, margin.top]);

    d3.select(node)
    .selectAll("g").remove();

    if(  typeof this.props.data === 'undefined' || this.props.data.length === 0 ||  this.props.data[0].length === 0 )
    return;
    var data = this.props.data[0];

    x.domain(d3.extent(data, function(d) {
      return d[2].count;
    }));
    y.domain([d3.min(data, function(d) {
       return d[2].treated-1.0;
     }),
    d3.max(data, function(d) {
       return d[2].treated+1.0;
     })]);

//    y.domain([0, 7]);
    d3.select(node).append("g")
    .attr("transform", "translate(" + margin.left + ",0)")
    .selectAll("dot")
    .data(data)
    .enter().append("circle")
    .attr("r", 5)
    .attr("cx", function(d) {  return x(d[2].count); })
    .attr("cy", function(d) {return y(d[2].treated); });

    // Add the X Axis
    d3.select(node).append("g")
    .attr("transform", "translate("+margin.left+"," + height + ")")
    .call(d3.axisBottom(x) .ticks(5) .tickFormat(d3.format(",d")));

    // Add the Y Axis
    d3.select(node).append("g")
    .attr("transform", "translate(" + margin.left + ",0)")
    .call(d3.axisLeft(y));
  }

  render() {
    return <div><h3>{ this.props.title}</h3><svg ref={node => this.node = node} width={this.props.size[0]} height={this.props.size[1]}>
    </svg></div>
  }
}

export default ScatterPlot
