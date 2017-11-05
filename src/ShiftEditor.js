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
  
  }

  render() {

      return  <RangeSlider
        step={2}
        onChange={this.onChange}
        wrapperClassName={styles.slider}
        highlightedTrackClassName={styles.sliderHighlightedTrack}
        trackClassName={styles.sliderTrack}
        handleClassName={styles.sliderHandle}
      />
  }
}

export default ShiftEditor
