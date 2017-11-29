import React, { Component } from 'react'
import {RadioGroup, Radio} from 'react-radio-group'
import Checkbox from 'rc-checkbox'
import './App.css'
import 'antd/dist/antd.css';
import { Row, Col } from 'antd';

import WeekChart from './WeekChart'

import ShiftEditor from './ShiftEditor'
import shiftdata from './shiftTypes'
import ShiftUtil from './ShiftUtil'
import EDSimulation from './EDSimulation'
import WaitDistribution from './WaitDistribution'
import ScatterPlot from './ScatterPlot'

import * as d3 from 'd3'

shiftdata.forEach( function(shift){
		if( shift.description=== "mon to fri")
			shift.description += " Monday Tuesday Wednesday Thursday Friday "
		else
			shift.description += " Sunday Monday Tuesday Wednesday Thursday Friday Saturday"
		shift.minor = shift.description.toLowerCase().includes("minor");
	});

var sUtil = new ShiftUtil();
var hourData = sUtil.shiftHours( shiftdata)

var simulation = new EDSimulation();

const ctasMax = 3;

var historicalData = {};
var simulated = [];

const colorScale = d3.scaleThreshold().domain([5,10,20,30]).range(["#75739F", "#5EAFC6", "#41A368", "#93C464"])

class App extends Component {
  constructor(props){
    super(props)
    this.onResize = this.onResize.bind(this)
    this.onHover = this.onHover.bind(this)
    this.onBrush = this.onBrush.bind(this)
    this.handleSiteChange = this.handleSiteChange.bind(this)
    this.handleShiftEdit = this.handleShiftEdit.bind(this)
		this.onChangeDataSet = this.onChangeDataSet.bind(this)
		this.runSimulation = this.runSimulation.bind(this)
		this.loadData = this.loadData.bind(this)
		this.runHourWeightSearch = this.runHourWeightSearch.bind(this)

		var copyOfHourData = JSON.parse(JSON.stringify(hourData));

    this.state = { screenWidth: 1400, screenHeight: 400, hover: "none",
		 brushExtent: [0,40],
		 site: "RGH",
		 shifts:hourData,
		 originalShifts: copyOfHourData,
		 ctas:2,
	   data: null,
 		 treatmentBySupply: []}
  }


	componentWillMount() {
         this.loadAllData();
  }

	loadAllData() {
			 this.loadData("arrivals")
			 this.loadData("waiting");
			 this.loadData("lwbs");
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
    this.setState({site:d},this.runSimulation)
  }

  handleShiftEdit(id, val){
    //update shift data
		console.log( "edit: "+id +" "+val)
		var tempShiftData = this.state.shifts
    tempShiftData.forEach((row,i) => {
      if( row.id === id){
        row.start = val[0];
        row.end=val[1];
      }
    })
		this.setState({shifts:tempShiftData},this.runSimulation)
  }
//TODO: use the orginal shift config for the run_correlation
// save the results used for the ScatterPlot from the correlation call
 runHourWeightSearch(){
	 var arrivals = historicalData[this.state.site].arrivals;
	 var lwbs = historicalData[this.state.site].lwbs;
	 var waiting = historicalData[this.state.site].waiting;

	 var origShifts = sUtil.shift2WeekCoverage(this.state.originalShifts).filter((d,i) => d.location.name === this.state.site);
   var increment = 0.1;
	 var bestCorrelation = 0;
	 var bestWeights = [];
	 var weights = [0.1,0.1,0.1,0.1,0.1,0.1,0.1,0.1];
	 for( var hour1 =0; hour1 <=8; hour1+=increment){
		 weights[0] = hour1;
	 	var origSupply = sUtil.testDoctorsPerHour( origShifts, weights )
	 	simulated = simulation.run_correlation( origSupply, arrivals, lwbs, waiting, weights  );
		if( simulated.corrcoeff > bestCorrelation){
			bestCorrelation = simulated.corrcoeff;
			bestWeights = weights.slice(0);
		}
 	}
	this.setState( {bestWeights:bestWeights});
	console.log( "bestCorrelation: "+bestCorrelation);
 }
	runSimulation(){
		if( typeof historicalData[this.state.site] === 'undefined'){
			return;
		}
		var arrivals = historicalData[this.state.site].arrivals;
    var lwbs = historicalData[this.state.site].lwbs;
    var waiting = historicalData[this.state.site].waiting;

		var origShifts = sUtil.shift2WeekCoverage(this.state.originalShifts).filter((d,i) => d.location.name === this.state.site);
		var origSupply = sUtil.testDoctorsPerHour( origShifts, this.state.bestWeights  )
		simulated = simulation.run_correlation( origSupply, arrivals, lwbs, waiting  );
		this.setState( {treatmentBySupply:simulated.treatmentBySupply})

		var testShifts = sUtil.shift2WeekCoverage(this.state.shifts).filter((d,i) => d.location.name === this.state.site);
		var testSupply = sUtil.testDoctorsPerHour( testShifts,this.state.bestWeights  )

		var showSupply = this.saveShowValue("supply");
		historicalData[this.state.site].supply = [testSupply];
		historicalData[this.state.site].supply.show = showSupply;

		simulated = simulation.generate_simulated_queue( testSupply, arrivals, lwbs, waiting  );

		var showSimulation =  this.saveShowValue("simulation");
	  historicalData[this.state.site].simulation = simulation.simulationAverages(simulated.waiting);
		historicalData[this.state.site].simulation.show = showSimulation;

		var showTreated =  this.saveShowValue("treated");
		historicalData[this.state.site].treated = simulation.simulationAverages(simulated.treated);
		historicalData[this.state.site].treated.show = showTreated;

		var showDiff =  this.saveShowValue("md_diff");
		historicalData[this.state.site].md_diff = simulation.accumulation(simulated.md_diff)
		historicalData[this.state.site].md_diff.show = showDiff;

		var showMeasured =  this.saveShowValue("measuredRate");
		historicalData[this.state.site].measuredRate = simulation.measuredRate( arrivals, lwbs, historicalData[this.state.site].waiting)
	  historicalData[this.state.site].measuredRate.show = showMeasured;

		this.setState({data:historicalData})
	}
 saveShowValue(datatype){
	 if( !historicalData[this.state.site][datatype] )
	 {
		 return false;
	 }
	 else{
		return historicalData[this.state.site][datatype].show;
	 }
 }
  componentDidMount() {
    window.addEventListener('resize', this.onResize, false)

    this.onResize()
  }

	onChangeDataSet(e) {
		if(historicalData[this.state.site][e.target.name] ){
			historicalData[this.state.site][e.target.name].show=e.target.checked;
			this.setState({ site:this.state.site})
		}
	}
 loadData(datatype) {
	  var dayCount =[9,9,8,8,9,9,9]; //count for each day of week in lwbs dataset
    var parent = this;
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
						historicalData[location][datatype].show=true;
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
	          if( ctasNumber < ctasMax ){
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
			if(  historicalData[parent.state.site].arrivals && historicalData[parent.state.site].lwbs&& historicalData[parent.state.site].waiting ){
				parent.runHourWeightSearch()

				var test = sUtil.shift2WeekCoverage(parent.state.shifts).filter((d,i) => d.location.name === parent.state.site);
				var testSupply = sUtil.testDoctorsPerHour( test, parent.state.bestWeights )
				historicalData[parent.state.site].supply = [testSupply];
				historicalData[parent.state.site].supply.show = false;
				parent.setState({
							 data: historicalData
					 });
			}
	  });
	}


//TODO: show what the unused capacity is during the simulation; how many hours is the queue length zero
  render() {
		if (!this.state.data) {
					 return <div />
			 }
    var filteredShiftData = this.state.shifts
    .filter((d,i) => d.location.name === this.state.site)
   var waitingHistogramData = parseWaitingData( historicalData[this.state.site] );
    return (
			<div className="App">
			 <h2>ED Shifts</h2>
			 <Row gutter={16}>
			  <Col span={4} >
			  </Col>
			  <Col span={12} >
			   <div>
			    <RadioGroup name="site" selectedValue={this.state.selectedValue} onChange={this.handleSiteChange}>
			    <Radio value="RGH" />RGH
			    <Radio value="FMC" />FMC
			    <Radio value="PLC" />PLC
			    <Radio value="SHC" />SHC
		    	<Radio value="ACH" />ACH
		     </RadioGroup>
			   <label> <Checkbox defaultChecked={historicalData[this.state.site].arrivals.show} name="arrivals" onChange={this.onChangeDataSet} />&nbsp; arrivals</label>
			   <label> <Checkbox defaultChecked={historicalData[this.state.site].waiting.show} name="waiting" onChange={this.onChangeDataSet} />&nbsp; waiting</label>
			   <label> <Checkbox defaultChecked={historicalData[this.state.site].lwbs.show} name="lwbs" onChange={this.onChangeDataSet} />&nbsp; lwbs</label>
			   <label> <Checkbox defaultChecked={false} name="supply" onChange={this.onChangeDataSet} />&nbsp; md supply</label>
		     <label> <Checkbox defaultChecked={false} name="simulation" onChange={this.onChangeDataSet} />&nbsp; simulation</label>
				 <label> <Checkbox defaultChecked={false} name="measuredRate" onChange={this.onChangeDataSet} />&nbsp; measured</label>
				 <label> <Checkbox defaultChecked={false} name="treated" onChange={this.onChangeDataSet} />&nbsp; sim treated</label>
				 <label> <Checkbox defaultChecked={false} name="md_diff" onChange={this.onChangeDataSet} />&nbsp; cum. treatment diff</label>


			   <WeekChart hoverElement={this.state.hover} onHover={this.onHover}
			      colorScale={colorScale} data={historicalData} size={[2*this.state.screenWidth/3, this.state.screenHeight / 2]}
			      site={this.state.site} />
			  </div>
			 </Col>
			 <Col span={4} >
			 </Col>
			</Row>
			<Row gutter={16}>
			 <Col span={12} >
			  <div>
			   <ShiftEditor onChange={this.handleShiftEdit} data={filteredShiftData} size={[this.state.screenWidth/3, this.state.screenHeight / 2]}/>
			  </div>
			 </Col><Col span={12} >
 			 <div>
 			 <ScatterPlot title="MD Count vs Treated" data={this.state.treatmentBySupply} ctas={this.state.ctas} size={[this.state.screenWidth/3, this.state.screenHeight / 2]}/>
 			 </div>
 			</Col>
		 </Row>
		 <Row gutter={16}>
			<Col span={12} >
			 <div>
			 <WaitDistribution title="Actual" data={[waitingHistogramData]} ctas={this.state.ctas} size={[this.state.screenWidth/3, this.state.screenHeight / 2]}/>
			 </div>
			</Col>
			<Col span={12} >
 			<div>
 			 <WaitDistribution title="Simulation" data={simulated.waiting} ctas={this.state.ctas} size={[this.state.screenWidth/3, this.state.screenHeight / 2]}/>
 			</div>
 		 </Col>
		</Row>
		</div>
    )
  }
}

//todo
//start with one location, one data type
//list of constants for data types, array of data types
//render method to have single check by comparing constants
//separate component for:
//selecting location and data types
//editing the shift times


function  parseWaitingData( siteData ){
	var data = [];
	if( typeof siteData !== 'undefined'){
		for( var h = 0; h < 168; h++){
			var hourOfData = [];
			 for( var c = 0; c < 3; c++){
				 hourOfData.push( siteData.waiting[c][h] );
			 }
			 data.push( hourOfData)
		}
	}
	return data;
}
function compareArray(array1, array2){
		for( var i =0; i < array1.length; i++){
			if( array1[i]!==array2[i]){
				console.log( "Item " + i +" is different "+array1[i]+" "+array2[i])
			}
		}
}


export default App
