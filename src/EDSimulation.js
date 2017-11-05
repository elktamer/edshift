class EDSimulation{
  function generate_simulated_queue(){
    var shift_data = shift2Data(shiftTypeList);
    var doctorSupply = doctorsPerHour(shift_data, false);

    var simulations = [];
    simulations.push([]);//skip the CTAS 1 values
    for( var ctasIndex = 1; ctasIndex < ctasMax; ctasIndex++){
      var ctasSim = [];
      for( n =0; n < sim_size; n++){
        var weekSim = simulatedWeek( doctorSupply, ctasIndex);
        ctasSim.push(weekSim);
      }
      simulations.push(ctasSim);
    }
    return simulations;
    
  }

  function simulatedWeek( doctorSupply, ctasIndex ){
    var queue =[];
    var waiting = site.wait[ctasIndex].wait[7*24-1];
    var lwbsQ = 0;
    //		console.log( "simulation");

    //var lwbsAVG = calcLWBSAverages();
    for( var t = 0; t < 7*24; t++){
      var arrivals =  poissonArrivals(t, ctasIndex) ; //simulated arrivals
      var capacity = doctorCapacity( doctorSupply, t, ctasIndex ) ; //todo: simulated capacity(exponential distribution)
      var reneged = renegCalc(ctasIndex, t);//todo: simulated lwbs (poisson)
      //		console.log( t+" "+arrivals+" "+capacity+" "+reneged);
      waiting = waiting + arrivals;// Preliminary queue
      waiting = waiting - reneged;
      var treated = Math.min( capacity, waiting);

      waiting = waiting - treated;
      queue.push( waiting );
    }
    return queue;
  }
}
export default EDSimulation
