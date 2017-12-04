import React, {  Component } from 'react'
import './App.css'

import * as d3 from 'd3'

class WaitDistribution extends Component {
  constructor(props) {
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

    var data = this.props.data;

    var x = d3.scaleLinear().rangeRound([0, width]),
      y = d3.scaleLinear().rangeRound([height, 0]);

    var g =  d3.select(node).append("g")
      .attr("transform", "translate(" + 40+ "," + -30 + ")");

    x.domain([0,data.length]);
    y.domain([0, d3.max(data, function(d) {
      return d;
    })]);

    g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x));

    g.append("g")
      .attr("class", "axis axis--y")
      .call(d3.axisLeft(y).ticks(10, "%"))
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .attr("text-anchor", "end")
      .text("Frequency");

    g.selectAll(".bar")
      .data(data)
      .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d, i) {
        return x(i);
      })
      .attr("y", function(d,i) {
        return y(d);
      })
      .attr("width", function(d,i) {
        return x(i+1) - x(i);
      })
      .attr("height", function(d) {
        return height - y(d);
      });
  }

  render() {
    return <div > < h3 > {
        this.props.title
      } < /h3><svg ref={node => this.node = node} width={this.props.size[0]} height={this.props.size[1]}> <
      /svg></div >
  }
}

export default WaitDistribution
