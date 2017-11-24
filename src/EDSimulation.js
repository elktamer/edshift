var jStat = require('jStat').jStat;

var sim_size = 1;
//TODO: ensure the histogram of the simulation matches a histogram of the known waits
class EDSimulation{

   generate_simulated_queue(doctorSupply, arrivals, lwbs, waiting){
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

  for( var t = 0; t < 7*24; t++){
    var treated=[], difference=[], treatmentRate=[];
    waiting = waiting.slice(0);

    for( var ctasIndex=0; ctasIndex < 3; ctasIndex++){
      waiting[ctasIndex] = waiting[ctasIndex] + poissonArrivals(arrivals,t, ctasIndex) ; //simulated arrivals
      waiting[ctasIndex] = waiting[ctasIndex] - renegCalc(lwbs, ctasIndex, t);//todo: simulated lwbs (poisson)
      treated[ctasIndex] = Math.min( expectedTreatment(doctorSupply[t], ctasIndex+1, waiting, treated ), waiting[ctasIndex] );

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

      difference[ctasIndex] = measured - treated[ctasIndex];//positive value means actual is greater than simulated
  /* to here: compare values */
      waiting[ctasIndex]  = waiting[ctasIndex]  - treated[ctasIndex] ;
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
var coeff = [[0.29569878101760866,0.09278568566889664,0.30726473102945484],
          [0.08453350984591561,0.18555681077395578,0.6786722181246297,-0.07581651310711282]];
//t1 = waiting1*coeff[0][0] + mdcount*coeff[0][1] + treated0*coeff[0][2]
//t2 = waiting2*oeff[1][0] +  mdcount*coeff[1][1] + treated0*coeff[1][2] + treated1*coeff[1][2]
function expectedTreatment(md_count, ctasNum, waiting, treated){
  if( ctasNum === 1 ){
    return waiting[0];
  }
  if( ctasNum === 2 ){
    return waiting[1]*coeff[0][0] + md_count*coeff[0][1] + treated[0]*coeff[0][2]
  }
  if( ctasNum === 3 ){
    return waiting[2]*coeff[1][0] +  md_count*coeff[1][1] + treated[1]*coeff[1][2] + treated[0]*coeff[1][3]
  }
}

function doMathStuff( treatmentArray ){
  var A = treatmentArray[0].filter(function(d){ return true;}).map( function(d){
    return [d[1].waiting, d[1].count, d[0].treated];
  });

  var b = treatmentArray[0].map( function(d){
    return d[1].treated;
  });

  var x = jStat.lstsq(A,b)
  console.log( "Solution:"+x);

  var A2 = treatmentArray[0].filter(function(d){ return true;}).map( function(d){

    return [d[2].waiting, d[2].count, d[1].treated, d[0].treated];
  });

  var b2 = treatmentArray[0].map( function(d){
    return d[2].treated;
  });

  var x2 = jStat.lstsq(A2,b2)
  console.log( "Solution:"+x2);
}

export default EDSimulation
