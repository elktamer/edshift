import * as d3 from 'd3'
var baseDateFormat = d3.timeParse("%Y-%m-%dT%I:%M:%S.000Z");

function onDay( shift, hour){
	var daysForShift= shift.description.split(' ');
	for(var i=0; i < daysForShift.length;i++){
		if( daysForShift[i] === dayForHour(hour))
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

class ShiftUtil{
 shift2Data( shifts) {

			var radialData = [];
			for (var hour = 0; hour < 168; hour++) {
				shifts
				.forEach(function (d) {
					var start = baseDateFormat(d.startTimeString).getHours() - 6
					if (start < 0)
						start = start + 23;
					var end = baseDateFormat(d.endTimeString).getHours() - 6-1;// per convo with Laurie-Ann, the last hour of a shift is spent on admin work
					if (end < 0)
						end = end + 24;

					var working = 0;
					var day_hour = hour % 24;
					if( onDay( d, hour) ){
					  if ((day_hour > start && day_hour <= end) ||
						(end < start && ((day_hour > start && day_hour >= end) || (day_hour < start && day_hour <= end)))) {
						  working = 1;
					  }
					}
					radialData.push({ key: d.code, value: working, time: hour, minor: (d.minor===true) });
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
		if( minutes == 59) start = start + 1;
		if (start < 0)
			start = start + 24;
		var end = baseDateFormat(d.endTimeString).getHours() - 6;// per convo with Laurie-Ann, the last hour of a shift is spent on admin work
		if (end < 0)
			end = end + 24;
		if( end < start)
			end = end+24;

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
		weekly.push(mdCount);
	}
	return weekly;
}

}
export default ShiftUtil
