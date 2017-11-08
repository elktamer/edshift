import React, { Component } from 'react'
import './App.css'

import * as d3 from 'd3'

//display the probability distribution and associated info using d3
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
    .domain([0, 20])
    .rangeRound([0, width]);

var realdata = this.props.data[2];
if( realdata.length !== 168) return;

    var rbins = d3.histogram()
    .domain(x.domain())
    .thresholds(x.ticks(20))(realdata);

    var y = d3.scaleLinear()
    .domain([0, d3.max(rbins, function(d) { return d.length; })])
    .range([height, 0]);
    d3.select(node)
      .selectAll(".bar").remove();
    var bar = d3.select(node)
      .selectAll(".bar")
    .data(rbins)
    .enter().append("g")
    .attr("class", "bar")
    .attr("transform", function(d) {
      return "translate(" + x(d.x0) + "," + y(d.length) + ")";
     });

    bar.append("rect")
    .attr("x", 1)
    .attr("width", x(rbins[0].x1) - x(rbins[0].x0) - 1)
    .attr("height", function(d) {
      return height - y(d.length);
     });

    bar.append("text")
    .attr("dy", ".75em")
    .attr("y", 6)
    .attr("x", (x(rbins[0].x1) - x(rbins[0].x0)) / 2)
    .attr("text-anchor", "middle")
    .text(function(d) { return formatCount(d.length); });

    d3.select(node).append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  }

  render() {
    return <svg ref={node => this.node = node} width={this.props.size[0]} height={this.props.size[1]}>
    </svg>
  }
}

export default WaitDistribution
