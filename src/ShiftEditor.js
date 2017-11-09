import React, { Component } from 'react'
import './App.css'
import 'rc-slider/assets/index.css';

import Tooltip from 'rc-tooltip';
import Slider from 'rc-slider';

const createSliderWithTooltip = Slider.createSliderWithTooltip;
const Range = createSliderWithTooltip(Slider.Range);
const Handle = Slider.Handle;


const style = {  margin: 50 };
const minor = {  margin: 50, background: 'red' };

const marks = {
  5: '5am',
  12: 'noon',
  24: 'midnight',
  32: '8am',
};
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
  onShiftChange(d, val){
    this.props.onChange( d, val);
  }
  render() {
          var seditor = this;
          var length =  this.props.data.length;
          var sliderList = this.props.data.sort(function(a, b){ return a.start - b.start;}).map(function(d, i){
            if( i === length-1)
              return  <Range key={d.id} onChange={seditor.onShiftChange.bind(seditor, d.id)}  marks={marks} min={5} max={32} defaultValue={[d.start, d.end]} tipFormatter={value => `${value}:00`} />;
            if( d.description.includes("Minor") )
              return <Range key={d.id} style={{background: 'red'}} min={5} max={32} defaultValue={[d.start, d.end]} tipFormatter={value => `${value}:00`} />;

            return <Range key={d.id} onAfterChange={seditor.onShiftChange.bind(seditor, d.id)}  min={5} max={32} defaultValue={[d.start, d.end]} tipFormatter={value => `${value}:00`} />;

          })
          return <div><h2>Shift Schedule</h2> <div style={style}>{sliderList}</div></div>
      }
}

export default ShiftEditor
