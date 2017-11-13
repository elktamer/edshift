var sim_size = 1;
//TODO: track the amount of time with unused capacity
//TODO: ensure the histogram of the simulation matches a histogram of the known waits
class EDSimulation{

   generate_simulated_queue(doctorSupply, arrivals, lwbs, waiting){
    var simulations = {waiting:[],treated:[],unused:[],md_diff:[]};
    var lastwait =[];
    for( var ctasIndex = 0; ctasIndex < 3;ctasIndex++){
     lastwait.push(waiting[ctasIndex][7*24-1]);
    }
    for( var n =0; n < sim_size; n++){
      var weekSim = simulatedWeek( doctorSupply, arrivals, lwbs, lastwait, waiting);
      lastwait = weekSim[weekSim.length-1]
      simulations.waiting.push(weekSim.queue);
      simulations.treated.push(weekSim.treated);
      simulations.md_diff.push(weekSim.md_diff);
    }
    return simulations;
  }

  simulationAverages( simulations){
  	var averages = [];
  	averages.push([]);
  	for( var ctasIndex = 1; ctasIndex < 3;ctasIndex++){
  	  var avg_queue =[];

  	  for( var hour =0; hour < 7*24; hour++){
  		var total = 0;
  		for( var n =0; n < sim_size; n++){
  			total += simulations[n][hour][ctasIndex];
  		}
  		var avg = total/sim_size;
  		avg_queue.push( avg);
  	  }

  	 averages.push( avg_queue );
  	}
  	return averages;//simulations;
  }
// the treatment rate is the current wait, minus the previous wait, plus the current arrivals
 measuredRate(arrivals, lwbs, waiting){
    var rates=[];
    for( var ctasIndex =0; ctasIndex < 3; ctasIndex++){
      var rate=[];

      for( var hour = 1; hour <168; hour++){
        var current = waiting[ctasIndex][hour-1] - waiting[ctasIndex][hour] + arrivals[ctasIndex][hour];
        current = current - lwbs[ctasIndex][hour];
        rate.push(current);
      }
      rates.push(rate);
    }
    return rates;
  }
}

function simulatedWeek( doctorSupply, arrivals, lwbs, startWait, waitArray ){
  var queue =[];
  var waiting = startWait.slice(0);
  var numTreated = [];
  var mdDiff = [];
//TODO: take lower ctas values into account for each level
  for( var t = 0; t < 7*24; t++){
    var arrival = [], reneged = [], treated=[], difference=[];
    waiting = waiting.slice(0);

    var capacity = doctorCapacity( doctorSupply, t ) ; //todo: simulated capacity(exponential distribution)
    for( var ctasIndex=0; ctasIndex < 3; ctasIndex++){
      arrival[ctasIndex] =  poissonArrivals(arrivals,t, ctasIndex) ; //simulated arrivals
      reneged[ctasIndex]  = renegCalc(lwbs, ctasIndex, t);//todo: simulated lwbs (poisson)
      if( waiting[ctasIndex] < 0){
        console.log( t +" error "+waiting[ctasIndex])
      }
      treated[ctasIndex] = Math.min( capacity, waiting[ctasIndex] );
      if( ctasIndex == 2){
        treated[ctasIndex] = Math.min( capacity*2, waiting[ctasIndex] );
      }
      capacity = Math.max( 0, capacity - treated[ctasIndex]);      //need to take into account how many were treated from higher priority ctas
//match up each of the known values, only difference should be the treated value
    //  console.log( t+" "+ ctasIndex+" "+capacity);
    var previousWait = 0;
      if( t > 0 ){
          if(  arrivals[ctasIndex][t] != arrival[ctasIndex] ){
            console.log( t +" arrival error ")
          }
          if(  lwbs[ctasIndex][t] != reneged[ctasIndex]  ){
            console.log( t +" lwbs error ")
          }
          previousWait = waitArray[ctasIndex][t-1]
        }
        //  var measured = waitArray[ctasIndex][t-1] - waitArray[ctasIndex][t] + arrivals[ctasIndex][t]-lwbs[ctasIndex][t];
        var measured = previousWait - waitArray[ctasIndex][t] + arrivals[ctasIndex][t]-lwbs[ctasIndex][t];
          //what about using the actual waits and comparing just the treatment calc?
          //this could point out differences in the estimate of the schedule vs reality
        difference[ctasIndex] = measured - treated[ctasIndex];//positive value means actual is greater than simulated
      //  console.log( t+" measured: "+measured +" simulated: "+testValue)

      waiting[ctasIndex]  = waiting[ctasIndex]  - treated[ctasIndex] ;
      waiting[ctasIndex]  = waiting[ctasIndex]  + arrival[ctasIndex] ;
      waiting[ctasIndex]  = waiting[ctasIndex]  - reneged[ctasIndex] ;
    }
    queue.push( waiting );
    numTreated.push( treated );
    mdDiff.push( difference);

  }
  return {queue:queue, treated:numTreated, md_diff:mdDiff};
}

function poissonArrivals( arrivals, hour, ctas){
	var rate = arrivals[ctas][hour] ;

	return rate;//poisson( rate ) ;
}
var patientsPerHour = [0.5, 1.1, 1.1]; //this is different for each location, as shown by the PLC "expected waiting" values

var base_rate = 2.0;
function doctorCapacity( supply, hour){
  return base_rate+Math.log(supply[hour])*3.75;

//    return supply[hour]*1.6;
}

function poisson( lambda) {
  var L = Math.exp(-lambda);
  var p = 1.0;
  var k = 0;

  do {
    k++;
    p *= Math.random();
  } while (p > L);

  return k - 1;
}

function renegCalc(lwbs,ctas, hour){
	var reneged = lwbs[ctas][hour];
	return reneged;
}
export default EDSimulation
