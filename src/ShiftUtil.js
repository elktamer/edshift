import * as d3 from 'd3'
var baseDateFormat = d3.timeParse("%Y-%m-%dT%I:%M:%S.000Z");

function onDay( shift, hour){
	var daysForShift= shift.description.split(' ');
	for(var i=0; i < daysForShift.length;i++){
		if( daysForShift[i] === dayForHour(hour))//times until 6 am will be covered by the previous day?
			return true;
	}
	return false;
}

function dayForHour(hour){
	if( hour < 24 )
	return "Sunday";
	if( hour < 48 )
	return "Monday";
	if( hour < 72 )
	return "Tuesday";
	if( hour < 96 )
	return "Wednesday";
	if( hour < 120 )
	return "Thursday";
	if( hour < 144 )
	return "Friday";
	if( hour < 168 )
	return "Saturday";

}
//convert shift time to hour of week instead of vice versa
function isWorking(hourOfWeek, shift){
	var hourOfDay = hourOfWeek % 24 + 6; //shift go 6 hours into the next day
	if( onDay( shift, hourOfWeek) && (shift.start <= hourOfDay && shift.end >= hourOfDay)){
		return 1;
	}

	return 0;
}

class ShiftUtil{
//how do I check for the hours worked during the hours past midnight?
//maybe loop through the shifts and days and then the hours?
 shift2Data( shifts) {
			var radialData = [];
				shifts.forEach(function (shift) {
					for (var hour = 0; hour < 168; hour++) {
						var working = isWorking(hour, shift)
						radialData.push({ key: shift.code, value: working, time: hour, minor: (shift.minor===true) });
					}
				});
			return radialData;
}
//todo: fix bug that ignores the shift edits
//make sure ends of shifts are on the correct date
shift2WeekCoverage( shifts){
		  var shiftCoverage = [];
			var endOfWeek = new Date(2017, 10, 11)
			var daysOfWeek = [];
			for (var d = new Date(2017, 10, 4); d <= endOfWeek; d.setDate(d.getDate() + 1)) {
			    daysOfWeek.push(new Date(d));
			}
			daysOfWeek.forEach( function(day){
				shifts.forEach(function (shift) {
					var shiftAssignment  = clone(shift)
					shiftAssignment.startDate = new Date(shift.startDate)
					shiftAssignment.endDate = new Date(shift.endDate)

					shiftAssignment.startDate.setFullYear( day.getFullYear() );
					shiftAssignment.startDate.setMonth( day.getMonth() );
					shiftAssignment.startDate.setDate( day.getDate() );
					shiftAssignment.startDate.setHours( shift.start)

					shiftAssignment.endDate.setFullYear( day.getFullYear() );
					shiftAssignment.endDate.setMonth( day.getMonth() );
					shiftAssignment.endDate.setDate( day.getDate() );
				if( shift.end < shift.start){
					Date.setDate( day.getDate()+1 );
				}
					shiftAssignment.endDate.setHours( shift.end)

					shiftCoverage.push(shiftAssignment);
				})
			})
			return shiftCoverage;
}

shiftHours(shifts){
	var shiftWithHours = []
	shifts
	.forEach(function (d) {
		d.key = d.id

		d.startDate =  baseDateFormat(d.startTimeString);
		d.startDate.setHours( d.startDate.getHours() - 6);
		d.endDate = baseDateFormat(d.endTimeString);
		d.endDate.setHours( d.endDate.getHours() - 6)

		var start = baseDateFormat(d.startTimeString).getHours() - 6
		var minutes =  baseDateFormat(d.startTimeString).getMinutes()
		if (start < 0)
			start = start + 24;

		if( minutes === 59){
			start = start + 1;
		}
		var end = baseDateFormat(d.endTimeString).getHours() - 6;// per convo with Laurie-Ann, the last hour of a shift is spent on admin work
		minutes =  baseDateFormat(d.endTimeString).getMinutes()
		if( minutes === 59) end  = end + 1;
		if (end < 0)
			end = end + 24;
		if( end < start )
			end = end + 24;

		d.start = start
		d.end = end
		shiftWithHours.push(d)
	})
	return shiftWithHours;
}

//todo: use actual end time instead of assuming 7 hours
// the issue is making sure that shifts that end after midnight are the next date
testDoctorsPerHour( coverage, workPerHour  ){
	var weekly = [];
	var parent = this;
	var timeOfWeek = new Date(2017, 10, 5)
	for (var d = 0; d <168; d++){
		timeOfWeek.setHours(timeOfWeek.getHours() + 1);
		var mdCount = 0;
		coverage.forEach( function(shiftAssignment){
			if( shiftAssignment.startDate <= timeOfWeek &&  shiftAssignment.endDate > timeOfWeek && shiftAssignment.minor === false){
				var hourWithinShift = Math.floor((timeOfWeek - shiftAssignment.startDate) / (1000*60*60))
				var work = 0;
				if( hourWithinShift >= 0 || hourWithinShift <=8){
					work = workPerHour[hourWithinShift]
			  }else{
				 console.log( "bad hour:" +hourWithinShift);
			  }
				mdCount += work;
			}
		})
		if(mdCount === 0){
			console.log( "MD Count should never be zero "+ d);
		}
			weekly.push(mdCount);
	}
	return weekly;
}

doctorsPerHour( coverage){
	var weekly = [];
	var timeOfWeek = new Date(2017, 10, 5)
	for (var d = 0; d <168; d++){
		timeOfWeek.setHours(timeOfWeek.getHours() + 1);
		var mdCount = 0;
		coverage.forEach( function(shiftAssignment){
			if( shiftAssignment.startDate <= timeOfWeek &&  shiftAssignment.endDate >= timeOfWeek && shiftAssignment.minor === false){
				mdCount++;
			}
		})
		if(mdCount === 0){
			console.log( "MD Count should never be zero "+ d);
		}
			weekly.push(mdCount);
	}
	return weekly;
}

}
function clone(obj) {
      if (obj === null || typeof(obj) !== 'object' || 'isActiveClone' in obj)
        return obj;
			var temp;
      if (obj instanceof Date)
         temp = new obj.constructor(); //or new Date(obj);
      else
         temp = obj.constructor();

      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          obj['isActiveClone'] = null;
          temp[key] = clone(obj[key]);
          delete obj['isActiveClone'];
        }
      }

      return temp;
    }
export default ShiftUtil
