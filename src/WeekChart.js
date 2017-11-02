import React, { Component } from 'react'
import './App.css'
import { scaleLinear } from 'd3-scale'
import { max, sum } from 'd3-array'
import { select } from 'd3-selection'
import { legendColor } from 'd3-svg-legend'
import { transition } from 'd3-transition'

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

  createWeekChart() {
    const node = this.node
  const dataCheck = this.props.data;
  }

  render() {
    return <svg ref={node => this.node = node} width={this.props.size[0]} height={this.props.size[1]}>
    </svg>
  }
}

export default WeekChart
