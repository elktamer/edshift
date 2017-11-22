import recordedTreatment from './treatmentRate'
var jStat = require('jStat').jStat;

var sim_size = 1;
//TODO: ensure the histogram of the simulation matches a histogram of the known waits
class EDSimulation{

   generate_simulated_queue(doctorSupply, arrivals, lwbs, waiting){
     outputAverages();
    var simulations = {waiting:[],treated:[],md_diff:[],treatmentBySupply:[], excessCapacity:[]};
    var lastwait =[];
    for( var ctasIndex = 0; ctasIndex < 3;ctasIndex++){
     lastwait.push(waiting[ctasIndex][7*24-1]);
    }
    for( var n =0; n < sim_size; n++){
      var weekSim = simulatedWeek( doctorSupply, arrivals, lwbs, lastwait, waiting);
      lastwait = weekSim[weekSim.length-1]
      simulations.waiting.push(weekSim.queue);
      simulations.treated.push(weekSim.treated);
      simulations.md_diff.push(weekSim.md_diff)
      simulations.treatmentBySupply.push( weekSim.treatmentBySupply)
      simulations.excessCapacity.push( weekSim.excessCapacity)
    }
    doMathStuff(simulations.treatmentBySupply);
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

  accumulation(simulations ){
    var cumulative = [];
  	cumulative.push([]);
  	for( var ctasIndex = 1; ctasIndex < 3;ctasIndex++){//skip ctas1
  	  var avg_queue =[];
      var total = 0;

  	  for( var hour = 0; hour < 7*24; hour++){
  		  for( var n =0; n < sim_size; n++){
  			  total += simulations[n][hour][ctasIndex];
  		  }
  		  avg_queue.push( total);
  	  }

  	 cumulative.push( avg_queue );
  	}
  	return cumulative;//simulations;
  }

  simulationAverageSingle( simulations){
    var averages = [];
    var avg_queue =[];

    for( var hour =0; hour < 7*24; hour++){
      var total = 0;
      for( var n =0; n < sim_size; n++){
        total += simulations[n][hour];
      }
      var avg = total/sim_size;
      avg_queue.push( avg);
    }

    averages.push( avg_queue );

    return averages;//simulations;
  }
// the treatment rate is the current wait, minus the previous wait, plus the current arrivals
 measuredRate(arrivals, lwbs, waiting){
    var rates=[];
    for( var ctasIndex =0; ctasIndex < 3; ctasIndex++){
      var rate=[];
      rate.push(0);
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
  var treatmentBySupply = [];
  var excessCapacity = [];
//TODO: take lower ctas values into account for each level ??
  for( var t = 0; t < 7*24; t++){
    var arrival = [], reneged = [], treated=[], difference=[], treatmentRate=[];
    waiting = waiting.slice(0);

    for( var ctasIndex=0; ctasIndex < 3; ctasIndex++){
      var debugWait = waiting[ctasIndex] ;
      arrival[ctasIndex] = poissonArrivals(arrivals,t, ctasIndex) ; //simulated arrivals
      reneged[ctasIndex] = renegCalc(lwbs, ctasIndex, t);//todo: simulated lwbs (poisson)
      waiting[ctasIndex] = waiting[ctasIndex] + arrival[ctasIndex] ;
      waiting[ctasIndex] = waiting[ctasIndex] - reneged[ctasIndex] ;
      treated[ctasIndex] = Math.min( expectedTreatment(doctorSupply[t], ctasIndex+1, treated ), waiting[ctasIndex] );

  /* compare values */
      var previousWait = waitArray[ctasIndex][7*24-1];
      if( t > 0 ){
        previousWait = waitArray[ctasIndex][t-1]
      }
      var measured = previousWait - waitArray[ctasIndex][t] + arrivals[ctasIndex][t] - lwbs[ctasIndex][t];
      treatmentRate.push( { count: doctorSupply[t],
                            time: t % 24,
                            waiting: waitArray[ctasIndex][t] + arrivals[ctasIndex][t] - lwbs[ctasIndex][t] ,
                            treated: measured })
//this is including arrivals and lwbs, but shouldn't be??
      difference[ctasIndex] = measured - treated[ctasIndex];//positive value means actual is greater than simulated
  /* to here: compare values */
      waiting[ctasIndex]  = waiting[ctasIndex]  - treated[ctasIndex] ;
      if( ctasIndex == 2){
        var debug = 0;
      }
    }
  //  excessCapacity.push( capacity);
    queue.push( waiting );
    numTreated.push( treated );
    mdDiff.push( difference);
    treatmentBySupply.push(treatmentRate);
  }
  return {queue:queue, treated:numTreated, md_diff:mdDiff, treatmentBySupply:treatmentBySupply, excessCapacity:excessCapacity};
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

function expectedTreatment(count, ctas, previous){
  var record = recordedTreatment.data[count];
  var result = record["ctas"+ctas]/record.count;
  for( var i =1; i < ctas; i++){
    var index = "ctas"+i;
  //  console.log( previous[i-1] +" "+ record[index]/record.count );
    result -= record[index]/record.count/(i+1);
  }

  return result;
}

function outputAverages(){
  for( var count = 2; count <=8; count ++){
    var record = recordedTreatment.data[count];
    if( typeof  record !== 'undefined'){
    var out = "";
    for( var i =1; i <= 3; i++){
      var index = "ctas"+i;
      out +=record[index]/record.count/count+" ";
    }
    console.log( count +" "+ out );
  }

  }
}

function doMathStuff( treatmentArray ){
  var A = treatmentArray[0].filter(function(d){ return true;}).map( function(d){
    var results = d.map( function( e ){
      return [e.waiting,e.treated];
    })
    return results[0].concat(results[1]).concat(results[2]);
  });

  var b = treatmentArray[0].map( function(d){
    return d[0].count;
  });
  var x = [0,0,0,0]
  var r = [0,0,0,0]
  x = gauss_jacobi(A,b,x,r)
  x = jStat.lstsq(A,b)
  console.log( "Solution:"+x);

}

export default EDSimulation
