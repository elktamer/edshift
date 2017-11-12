import React, { Component } from 'react'
import './App.css'

import * as d3 from 'd3'
//TODO: convert the queue length into waiting time. How?
// maybe by tracking time in the simulation
//display the probability distribution and associated info using d3

//TODO: show both ctas2 and ctas3 data at the same time
class WaitDistribution extends Component {
  constructor(props){
    super(props)
    this.createWaitDistribution = this.createWaitDistribution.bind(this)
  }

  componentDidMount() {
    this.createWaitDistribution()
  }

  componentDidUpdate() {
    this.createWaitDistribution()
  }

  createWaitDistribution() {
    const node = this.node

    var formatCount = d3.format(",.0f");

    const width = this.props.size[0]
    const height = this.props.size[1]

    var x = d3.scaleLinear()
    .domain([0, 25])
    .rangeRound([0, width]);

var realdata = this.props.data;
if( typeof realdata === 'undefined') return;//won't work for a single run simulation
    var combineddata = [];
    realdata.forEach( function(d){
      d.forEach(function(r){
        combineddata.push(r[2])
      })
    })

    var rbins = d3.histogram()
    .domain(x.domain())
    .thresholds(x.ticks(20))(combineddata);

    var y = d3.scaleLinear()
    .domain([0, d3.max(rbins, function(d) { return d.length; })])
    .range([height, 50]);

    d3.select(node)
      .selectAll(".bar").remove();
    var bar = d3.select(node)
      .selectAll(".bar")
    .data(rbins)
    .enter().append("g")
    .attr("class", "bar")
    .attr("transform", function(d) {
      return "translate(" + x(d.x0) + "," + (y(d.length) -30)+ ")";
     });

    bar.append("rect")
    .attr("x", 1)
    .attr("width", x(rbins[0].x1) - x(rbins[0].x0) - 1)
    .attr("height", function(d) {
      return height - y(d.length);
     });

    bar.append("text")
    .attr("dy", ".75em")
    .attr("y", -10)
    .attr("x", (x(rbins[0].x1) - x(rbins[0].x0)) / 2)
    .attr("text-anchor", "middle")
    .text(function(d) {
      var percentage = d.length*100.0/combineddata.length
       return formatCount(percentage)+"%";
     });

    d3.select(node).append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," +( height-30) + ")")
    .call(d3.axisBottom(x));

  }

  render() {
    return <svg ref={node => this.node = node} width={this.props.size[0]} height={this.props.size[1]}>
    </svg>
  }
}

export default WaitDistribution
