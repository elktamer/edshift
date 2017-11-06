import React, { Component } from 'react'
import './App.css'

import  { Range } from 'rc-slider';
import 'rc-slider/assets/index.css';


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
              return  <Range min={5} max={32} defaultValue={[d.start, d.end]} tipFormatter={value => `${value}%`} />;
          })
          return sliderList
      }
}

export default ShiftEditor
