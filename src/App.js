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
import HourProductivityDistribution from './HourProductivityDistribution'
import ScatterPlot from './ScatterPlot'

import * as d3 from 'd3'

shiftdata.forEach( function(shift){
		if( shift.description=== "mon to fri")
			shift.description += " Monday Tuesday Wednesday Thursday Friday "
		else
			shift.description += " Sunday Monday Tuesday Wednesday Thursday Friday Saturday"
		shift.minor = shift.description.toLowerCase().includes("minor");
	});

var hourData = ShiftUtil.shiftHours( shiftdata)

const ctasMax = 3;

//var historicalData = {};

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
		 temp: {},
	   data: null,
 		 treatmentBySupply: [],
	 show:{arrivals:false, waiting:true, lwbs:false, supply:false, simulation:false, measuredRate:false, treated:false, md_diff:false}}
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
	var arrivals = this.state.temp[this.state.site].arrivals;
	var lwbs =this.state.temp[this.state.site].lwbs;
	var waiting = this.state.temp[this.state.site].waiting;

	var origShifts = ShiftUtil.shift2WeekCoverage(this.state.originalShifts).filter((d,i) => d.location.name === this.state.site);
	var bestWeights = ShiftUtil.weightSearch( false, arrivals, waiting, lwbs, origShifts)

	this.setState( {bestWeights:bestWeights});
	var origSupply = ShiftUtil.testDoctorsPerHour( origShifts, this.state.bestWeights  )
	var correlationValues = EDSimulation.run_correlation( origSupply, arrivals, lwbs, waiting  );
	this.setState( {treatmentBySupply:correlationValues.treatmentBySupply})
	this.setState( {coefficients:correlationValues.coefficients});
}

	runSimulation(){
		if( typeof this.state.data[this.state.site] === 'undefined'){
			return;
		}
		var arrivals =  this.state.data[this.state.site].arrivals;
    var lwbs =  this.state.data[this.state.site].lwbs;
    var waiting =  this.state.data[this.state.site].waiting;

		var testShifts = ShiftUtil.shift2WeekCoverage(this.state.shifts).filter((d,i) => d.location.name === this.state.site);
		var testSupply = ShiftUtil.testDoctorsPerHour( testShifts,this.state.bestWeights  )

		var historicalData = this.state.data[this.state.site];
		historicalData.supply = [testSupply];

		var simulated = EDSimulation.generate_simulated_queue( testSupply, arrivals, lwbs, waiting, this.state.coefficients  );

	  historicalData.simulation = EDSimulation.simulationAverages(simulated.waiting);
		historicalData.treated = EDSimulation.simulationAverages(simulated.treated);
		historicalData.md_diff = EDSimulation.accumulation(simulated.md_diff)
		historicalData.measuredRate = EDSimulation.measuredRate( arrivals, lwbs, historicalData.waiting)

		var temp = this.state.data;
		temp[this.state.site] == historicalData
		this.setState({data:temp})
	}

  componentDidMount() {
    window.addEventListener('resize', this.onResize, false)

    this.onResize()
  }

	onChangeDataSet(e) {
		var show = this.state.show;
		show[e.target.name]=e.target.checked
  	this.setState(show)
	}
 loadData(datatype) {
	  var dayCount =[9,9,8,8,9,9,9]; //count for each day of week in lwbs dataset
    var parent = this;

	  d3.text("./"+datatype+".csv", function(textString) {
			var historicalData=parent.state.data;
			if( historicalData === null) historicalData =[]
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
			var temp = parent.state.temp;

			Object.keys(historicalData).forEach(function(key){
				if( !temp[key] )
					temp[key]={};
					Object.keys(historicalData[key]).forEach(function(datatype){
						temp[key][datatype] = historicalData[key][datatype]
						parent.setState({ temp: temp });
					});
			})

			if(  parent.state.temp[parent.state.site].arrivals && parent.state.temp[parent.state.site].lwbs&& parent.state.temp[parent.state.site].waiting ){
				parent.runHourWeightSearch()

				var test = ShiftUtil.shift2WeekCoverage(parent.state.shifts).filter((d,i) => d.location.name === parent.state.site);
				var testSupply = ShiftUtil.testDoctorsPerHour( test, parent.state.bestWeights )
				temp[parent.state.site].supply = [testSupply];
			parent.setState({
							 data: temp
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
			   <label> <Checkbox defaultChecked={this.state.show.arrivals} name="arrivals" onChange={this.onChangeDataSet} />&nbsp; arrivals</label>
			   <label> <Checkbox defaultChecked={this.state.show.waiting} name="waiting" onChange={this.onChangeDataSet} />&nbsp; waiting</label>
			   <label> <Checkbox defaultChecked={this.state.show.lwbs} name="lwbs" onChange={this.onChangeDataSet} />&nbsp; lwbs</label>
			   <label> <Checkbox defaultChecked={this.state.show.supply} name="supply" onChange={this.onChangeDataSet} />&nbsp; md supply</label>
		     <label> <Checkbox defaultChecked={this.state.show.simulation} name="simulation" onChange={this.onChangeDataSet} />&nbsp; simulation</label>
				 <label> <Checkbox defaultChecked={this.state.show.measuredRate} name="measuredRate" onChange={this.onChangeDataSet} />&nbsp; measured</label>
				 <label> <Checkbox defaultChecked={this.state.show.treated} name="treated" onChange={this.onChangeDataSet} />&nbsp; sim treated</label>
				 <label> <Checkbox defaultChecked={this.state.show.md_diff} name="md_diff" onChange={this.onChangeDataSet} />&nbsp; cum. treatment diff</label>

			   <WeekChart hoverElement={this.state.hover} onHover={this.onHover}
			      colorScale={colorScale} data={this.state.data[this.state.site]} size={[2*this.state.screenWidth/3, this.state.screenHeight]}
			      site={this.state.site} show={this.state.show} />
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
			 <WaitDistribution title="Actual" data={this.state.data[this.state.site].waiting} ctas={this.state.ctas} size={[this.state.screenWidth/3, this.state.screenHeight / 2]}/>
			 </div>
			</Col>
			<Col span={12} >
 			<div>
 			 <WaitDistribution title="Simulation" data={this.state.data[this.state.site].simulation} ctas={this.state.ctas} size={[this.state.screenWidth/3, this.state.screenHeight / 2]}/>
 			</div>
 		 </Col>
		</Row>
		<Row gutter={16}>
		 <Col span={12} >
			<div>
			<HourProductivityDistribution title="Hourly Productivity" data={this.state.bestWeights} ctas={this.state.ctas} size={[this.state.screenWidth/3, this.state.screenHeight / 2]}/>
			</div>
		 </Col>
		 <Col span={12} >
		 <div>
		 </div>
		</Col>
	 </Row>
		</div>
    )
  }
}

function compareArray(array1, array2){
		for( var i =0; i < array1.length; i++){
			if( array1[i]!==array2[i]){
				console.log( "Item " + i +" is different "+array1[i]+" "+array2[i])
			}
		}
}


export default App
