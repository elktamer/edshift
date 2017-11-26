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
      treated[ctasIndex] = Math.min( expectedTreatment(doctorSupply[t], ctasIndex+1, waiting, treated, renegCalc(lwbs, ctasIndex, t) ), waiting[ctasIndex] );

  /* compare values */
      var previousWait = waitArray[ctasIndex][7*24-1];
      if( t > 0 ){
        previousWait = waitArray[ctasIndex][t-1]
      }
      var measured = previousWait - waitArray[ctasIndex][t] + arrivals[ctasIndex][t] - lwbs[ctasIndex][t];
      treatmentRate.push( { count: doctorSupply[t],
                            time: t % 24,
                            waiting: waitArray[ctasIndex][t] + arrivals[ctasIndex][t] - lwbs[ctasIndex][t] ,
                            treated: measured,
                            reneg: renegCalc(lwbs, ctasIndex, t)})

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

//var coeff = [[ 0.3553683272345083, 0.02402246505738014, 0.3581954529524639, -0.7185178039604907],
//[0.16744577174848244, 0.04161842651193627, 0.6283488380104464, 0.21564171566457788, -0.7888350931664319]];
var coeff =[
  [1.4252392085245382, 0.3364809413295287, 0.17261767203145983, -0.7173196669847957],
  [1.5234806304220174, 0.5196766219437663, 0.22918501456675308, -0.9083214769421125]];

function expectedTreatment(md_count, ctasNum, waiting, treated, reneg){
  if( ctasNum === 1 ){
    return waiting[0];
  }
  if( ctasNum === 2 ){
    return coeff[0][0]+md_count*coeff[0][1] + treated[0]*coeff[0][2] + reneg*coeff[0][3]
  }
  if( ctasNum === 3 ){
    return coeff[1][0]+ md_count*coeff[1][1] + treated[0]*coeff[1][2] + reneg*coeff[1][3]
  }
}

function doMathStuff( treatmentArray ){
  var A = treatmentArray[0].filter(function(d){ return true;}).map( function(d){
    return [1, d[1].count, d[0].treated, d[1].reneg];
  });
  var b = treatmentArray[0].map( function(d){
    return d[1].treated;
  });
  var x = jStat.lstsq(A,b)
  console.log( x);

  var A2 = treatmentArray[0].filter(function(d){ return true;}).map( function(d){
    return [1, d[2].count,  d[0].treated, d[2].reneg];
  });
  var b2 = treatmentArray[0].map( function(d){
    return d[2].treated;
  });
  var x2 = jStat.lstsq(A2,b2)
  console.log( x2 );
}

export default EDSimulation
