import React, { Component } from 'react'
import './App.css'
import styles from './styles.css';

import {RangeSlider} from 'rr-slider';

class ShiftEditor extends Component {
  constructor(props){
    super(props)
    this.createShiftEditor = this.createShiftEditor.bind(this)
    this.render = this.render.bind(this)

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
          var shifts = this.props.data;
          var seditor = this;
          var sliderList = shifts.map(function(d){
                          return <RangeSlider
                            step={2}
                            onChange={seditor.onChange}
                            wrapperClassName={styles.slider}
                            highlightedTrackClassName={styles.sliderHighlightedTrack}
                            trackClassName={styles.sliderTrack}
                            handleClassName={styles.sliderHandle}
                          />;
                        })

          return sliderList
      }

}

export default ShiftEditor
