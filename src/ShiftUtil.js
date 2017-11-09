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
/*	var day_hour = hourOfWeek % 24;
	if( onDay( shift, hourOfWeek) ){
		if ((day_hour > shift.start && day_hour <= shift.end) ||
		(shift.end < shift.start && ((day_hour > shift.start && day_hour >= shift.end) || (day_hour < shift.start && day_hour <= shift.end)))) {
			return true;
		}
	}
*/
	var hourOfDay = hourOfWeek % 24;
	//what about the case where the shift has started on the previous day?
	if( onDay( shift, hourOfWeek) && (shift.start < hourOfDay && shift.end > hourOfDay)){
		return 1;
	}

	return 0;
}

class ShiftUtil{
//how do I check for the hours worked during the hours past midnight?
//maybe loop through the shifts and days and then the hours?
 shift2Data( shifts) {
			var radialData = [];
			for (var hour = 0; hour < 168; hour++) {
				shifts.forEach(function (shift) {
					var working = isWorking(hour, shift)
					radialData.push({ key: shift.code, value: working, time: hour, minor: (shift.minor===true) });
				});
			}
			return radialData;
}

shiftHours(shifts){
	var shiftWithHours = []
	shifts
	.forEach(function (d) {
		d.key = d.id
		var start = baseDateFormat(d.startTimeString).getHours() - 6
		var minutes =  baseDateFormat(d.startTimeString).getMinutes()
		if (start < 0)
			start = start + 23;

		if( minutes === 59){
			start = start + 1;
		}
		var end = baseDateFormat(d.endTimeString).getHours() - 6-1;// per convo with Laurie-Ann, the last hour of a shift is spent on admin work
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
doctorsPerHour( shiftHours ){
	var weekly = [];
	var minor = false;
	for( var hour = 0; hour < 168; hour++){
		var mdCount = 0;
		for( var i =0; i < shiftHours.length;i++ ){
			if( shiftHours[i].time === hour && shiftHours[i].value === 1 && shiftHours[i].minor === minor)
				mdCount++;
		}
		if(mdCount === 0){
			console.log( "MD Count should never be zero "+ hour);
		}
		weekly.push(mdCount);
	}
	return weekly;
}

}
export default ShiftUtil
