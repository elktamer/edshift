var sim_size = 1;
//TODO: track the amount of time that there is over capacity
//TODO: track both ctas2 & ctas3 in the simultation( & ctas1?)
class EDSimulation{

   generate_simulated_queue(doctorSupply, arrivals, lwbs){
    var simulations = [];
    var lastwait = [0,0,0];
    for( var n =0; n < sim_size; n++){
      var weekSim = simulatedWeek( doctorSupply, arrivals, lwbs, lastwait);
      lastwait = weekSim[weekSim.length-1]
      simulations.push(weekSim);
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
}

function simulatedWeek( doctorSupply, arrivals, lwbs, startWait ){
  var queue =[];
  var waiting = startWait.slice(0);

//TODO: take lower ctas values into account for each level
  for( var t = 0; t < 7*24; t++){
    var arrival = [], reneged = [], treated =[];
    var capacity = doctorCapacity( doctorSupply, t ) ; //todo: simulated capacity(exponential distribution)
    waiting = waiting.slice(0);

    for( var ctasIndex=0; ctasIndex < 3; ctasIndex++){
      arrival[ctasIndex] =  poissonArrivals(arrivals,t, ctasIndex) ; //simulated arrivals
      reneged[ctasIndex]  = renegCalc(lwbs, ctasIndex, t);//todo: simulated lwbs (poisson)
      waiting[ctasIndex]  = waiting[ctasIndex]  + arrival[ctasIndex] ;
      waiting[ctasIndex]  = waiting[ctasIndex]  - reneged[ctasIndex] ;
      treated[ctasIndex]  = Math.min( capacity, waiting[ctasIndex] );
      //need to take into account how many were treated from higher priority ctas
      waiting[ctasIndex]  = waiting[ctasIndex]  - treated[ctasIndex] ;
    }
    queue.push( waiting );
  }
  return queue;
}

function poissonArrivals( arrivals, hour, ctas){
	var rate = arrivals[ctas][hour] ;

	return rate;//poisson( rate ) ;
}
var patientsPerHour = [0.5, 1.1, 1.1]; //this is different for each location, as shown by the PLC "expected waiting" values

var base_rate = 2.0;
function doctorCapacity( supply, hour){
    return base_rate+Math.log(supply[hour]);
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
