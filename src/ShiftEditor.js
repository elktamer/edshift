import React, { Component } from 'react'
import './App.css'
import styles from './styles.css';

import {RangeSlider} from 'rr-slider';
import * as d3 from 'd3'


class ShiftEditor extends Component {
  constructor(props){
    super(props)
    this.createShiftEditor = this.createShiftEditor.bind(this)
  }

  componentDidMount() {
    this.createShiftEditor()
  }

  componentDidUpdate() {
    this.createShiftEditor()
  }

  createShiftEditor() {
    const node = this.node
    d3.select(node)
      .selectAll("RangeSlider")
      .data([0])
      .enter()
      .append("RangeSlider")
        .attr("class", "legend")

/*  <RangeSlider
  step={2}
  onChange={this.onChange}
  wrapperClassName={styles.slider}
  highlightedTrackClassName={styles.sliderHighlightedTrack}
  trackClassName={styles.sliderTrack}
  handleClassName={styles.sliderHandle}
/>
*/
  }

  render() {

      return <svg ref={node => this.node = node} width={this.props.size[0]} height={this.props.size[1]}>
      </svg>
  }
}

export default ShiftEditor
