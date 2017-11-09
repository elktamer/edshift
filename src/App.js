import React, { Component } from 'react'
import {RadioGroup, Radio} from 'react-radio-group'
import { Card, Button, CardTitle, CardText, Row, Col } from 'reactstrap';

import './App.css'
import WeekChart from './WeekChart'

import ShiftEditor from './ShiftEditor'
import shiftdata from './shiftTypes'
import ShiftUtil from './ShiftUtil'
import EDSimulation from './EDSimulation'
import WaitDistribution from './WaitDistribution'

import * as d3 from 'd3'

shiftdata.forEach( function(shift){
		if( shift.description=== "mon to fri")
			shift.description += " Monday Tuesday Wednesday Thursday Friday "
		else
			shift.description += " Sunday Monday Tuesday Wednesday Thursday Friday Saturday"

		if( shift.description.toLowerCase().includes("minor")){
			shift.minor = true;
		}
		
	});

var sUtil = new ShiftUtil();
var hourData = sUtil.shiftHours( shiftdata)

var simulation = new EDSimulation();

const ctasMax = 3;

var historicalData = {};
var simulated = [[0],[0],[0]];
loadData("arrivals");
loadData("waiting");
loadData("lwbs");

const colorScale = d3.scaleThreshold().domain([5,10,20,30]).range(["#75739F", "#5EAFC6", "#41A368", "#93C464"])

class App extends Component {
  constructor(props){
    super(props)
    this.onResize = this.onResize.bind(this)
    this.onHover = this.onHover.bind(this)
    this.onBrush = this.onBrush.bind(this)
    this.handleSiteChange = this.handleSiteChange.bind(this)
    this.handleShiftEdit = this.handleShiftEdit.bind(this)
    this.state = { screenWidth: 1400, screenHeight: 400, hover: "none", brushExtent: [0,40], site: "RGH", shifts:hourData, ctas:2 }
  }

  onResize() {
    this.setState({ screenWidth: window.innerWidth, screenHeight: window.innerHeight - 120 })
  }

  onHover(d) {
    this.setState({ hover: d.id })
  }

  onBrush(d) {
    this.setState({ brushExtent: d })
  }
  handleSiteChange(d){
    this.setState({site:d})
  }

  handleShiftEdit(id, val){
    //update shift data
    hourData.forEach((row,i) => {
      if( row.id === id){
        row.start = val[0];
        row.end=val[1];
      }
    })
    var arrivals =historicalData[this.state.site].arrivals;
    var lwbs = historicalData[this.state.site].lwbs;
    var shift_data = sUtil.shift2Data(hourData);
    var doctorSupply = sUtil.doctorsPerHour(shift_data, false);
		 simulated = simulation.generate_simulated_queue( doctorSupply, arrivals, lwbs );
    historicalData[this.state.site].simulation = simulationAverages(simulated);

    this.setState({ shifts:hourData})

  }

  componentDidMount() {
    window.addEventListener('resize', this.onResize, false)
    this.onResize()
  }

  render() {
    var filteredShiftData = hourData
    .filter((d,i) => d.location.name === this.state.site)
		var filteredSimulationData = [[0],[0],[0]];
		if(  typeof historicalData[this.state.site]!== "undefined"
		&& typeof historicalData[this.state.site].simulation !== "undefined")
		 filteredSimulationData = historicalData[this.state.site].simulation;

    return (
      <div className="App">
      <h2>ED Shifts</h2>
      <div>
      <RadioGroup name="site" selectedValue={this.state.selectedValue} onChange={this.handleSiteChange}>
        <Radio value="RGH" />RGH
        <Radio value="FMC" />FMC
        <Radio value="PLC" />PLC
        <Radio value="SHC" />SHC
        <Radio value="ACH" />ACH
      </RadioGroup>

      <WeekChart hoverElement={this.state.hover} onHover={this.onHover}
      colorScale={colorScale} data={historicalData} size={[4*this.state.screenWidth/5, this.state.screenHeight / 3]}
      site={this.state.site} />
			<Row>
			<Col  xs="6">
      <ShiftEditor onChange={this.handleShiftEdit} data={filteredShiftData} size={[this.state.screenWidth/3, this.state.screenHeight / 2]}/>
			</Col>
			<Col  xs="6">
			<WaitDistribution data={simulated} ctas={this.state.ctas} size={[this.state.screenWidth/3, this.state.screenHeight / 2]}/>
			</Col>
			</Row>
	    </div>
      </div>
    )
  }
}
var sim_size =1000;
function simulationAverages( simulations){
	var averages = [];
	averages.push([]);
	for( var ctasIndex = 1; ctasIndex < ctasMax;ctasIndex++){
	  var avg_queue =[];

	  for( var hour =0; hour < 7*24; hour++){
		var total = 0;
		for( var n =0; n < sim_size; n++){
			total += simulations[ctasIndex][n][hour];
		}
		var avg = total/sim_size;
		avg_queue.push( avg);
	  }

	 averages.push( avg_queue );
	}
	return averages;//simulations;
}
//todo
//start with one location, one data type
//list of constants for data types, array of data types
//render method to have single check by comparing constants
//separate component for:
//selecting location and data types
//editing the shift times
function loadData(datatype) {
  var dayCount =[9,9,8,8,9,9,9]; //count for each day of week in lwbs dataset

  d3.text("./"+datatype+".csv", function(textString) {

    var input = d3.csvParseRows(textString);
    var location = "";
    input.forEach(function(d, row) {
      if (d[0] === ""){
        d[0] = location;
      }else{
        location = d[0];
        if( typeof historicalData[location] === "undefined"){
          historicalData[location] = {};
        }
        if( typeof historicalData[location][datatype] === "undefined"){
          historicalData[location][datatype]=[];
        }
      }
      var modsize = Math.round((d.length-3)/7)
      for( var k =0; k < d.length-1; k++){
        if( d[1] === "Total") continue;
        if (k > 0){
          d[k] = +d[k];
        }
        if( k > 1 ){
          var ctasNumber = (k - 2) % modsize;
          if( typeof historicalData[location][datatype][ctasNumber] === "undefined"){
            historicalData[location][datatype][ctasNumber]=[];
          }
          if( ctasNumber < ctasMax &&  ctasNumber > 0){
            var dayOfWeek = Math.floor((k-2) / modsize );
            var hour = d[1] + dayOfWeek*24
            historicalData[location][datatype][ctasNumber][hour]=d[k];
            if( datatype ==="lwbs" ){
              historicalData[location][datatype][ctasNumber][hour]/=dayCount[dayOfWeek];
            }
          }
        }
      }
    });
  });
}
export default App
