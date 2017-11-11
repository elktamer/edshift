var sim_size = 1;

class EDSimulation{

   generate_simulated_queue(doctorSupply, arrivals, lwbs){

    var simulations = [];
    simulations.push([]);//skip the CTAS 1 values
    for( var ctasIndex = 1; ctasIndex < 5; ctasIndex++){
      var ctasSim = [];
      var lastwait = 0;
      for( var n =0; n < sim_size; n++){
        var weekSim = simulatedWeek( doctorSupply, ctasIndex, arrivals, lwbs, lastwait);
        lastwait = weekSim[weekSim.length-1]
        ctasSim.push(weekSim);
      }
      simulations.push(ctasSim);
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
  			total += simulations[ctasIndex][n][hour];
  		}
  		var avg = total/sim_size;
  		avg_queue.push( avg);
  	  }

  	 averages.push( avg_queue );
  	}
  	return averages;//simulations;
  }
}

function simulatedWeek( doctorSupply, ctasIndex,arrivals,lwbs, startWait ){
  var queue =[];
  var waiting = startWait;
  //		console.log( "simulation");

  //var lwbsAVG = calcLWBSAverages();
  for( var t = 0; t < 7*24; t++){
    var arrival =  poissonArrivals(arrivals,t, ctasIndex) ; //simulated arrivals
    var capacity = doctorCapacity( doctorSupply, t, ctasIndex ) ; //todo: simulated capacity(exponential distribution)
    var reneged = renegCalc(lwbs, ctasIndex, t);//todo: simulated lwbs (poisson)
    //		console.log( t+" "+arrivals+" "+capacity+" "+reneged);
    waiting = waiting + arrival;// Preliminary queue
    waiting = waiting - reneged;
    var treated = Math.min( capacity, waiting);

    waiting = waiting - treated;
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
function doctorCapacity( supply, hour, ctas ){
    return base_rate+Math.log(supply[hour]*patientsPerHour[ctas]);
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
