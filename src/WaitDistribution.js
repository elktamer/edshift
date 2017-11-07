import React, { Component } from 'react'
import './App.css'

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
  }

  render() {
      return <svg ref={node => this.node = node} width={this.props.size[0]} height={this.props.size[1]}>
      </svg>
  }
}

export default WaitDistribution
