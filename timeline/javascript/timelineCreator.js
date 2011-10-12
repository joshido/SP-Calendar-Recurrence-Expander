var eventSource = new Timeline.DefaultEventSource();
var maxOccurence = 5;

function eventToeventsource(date, title, description, color) {
	eventSource.add(new Timeline.DefaultEventSource.Event({
		start: date,
		instant: true,
		text: title,
		description: description + "<br />",
		color: color
	}));
	tl.paint();
}

function takeEventOut(path, listId, siteName) {
	jQuery.getScript(path + "/jquery.SPServices-0.6.2.min.js", function(){
		var site = $().SPServices.SPGetCurrentSite();
		var start = Date.today().add(3).days();
		$().SPServices({
			operation: "GetListItems",
			async: false,
			webURL: site + "/" + siteName,
			listName: listId,
			CAMLViewFields: "<ViewFields>" +
								"<FieldRef Name='Title' />" +
								"<FieldRef Name='EventDate' />" +
								"<FieldRef Name='EndDate' />" +
								"<FieldRef Name='Location' />" +
								"<FieldRef Name='Description' />" +
								"<FieldRef Name='fRecurrence' />" +
								"<FieldRef Name='RecurrenceData' />" +
							"</ViewFields>",
			CAMLQuery: 		'<Query>' +
								'<CalendarDate>' + start + '</CalendarDate>' +
								'<Where>' +
									'<DateRangesOverlap>' + 
										'<FieldRef Name="EventDate" />' +
										'<FieldRef Name="EndDate" />' +
										'<FieldRef Name="RecurrenceID" />' +
										'<Value Type="DateTime">' + 
											'<Year />' + 
										'</Value>' +
									'</DateRangesOverlap>' +
								'</Where>' +
								'<OrderBy>' +
									'<FieldRef Name="EventDate" />' +
								'</OrderBy>' +
							'</Query>',
			CAMLQueryOptions:	'<QueryOptions>' +
									'<CalendarDate>' + start + '</CalendarDate>' +
									'<RecurrencePatternXMLVersion>v3</RecurrencePatternXMLVersion>' +
									'<ExpandRecurrence>TRUE</ExpandRecurrence>' + 
								'</QueryOptions>',
			debug: true,
			completefunc: function(xData, Status) {
				$(xData.responseXML).find("[nodeName='z:row']").each(function(){
					var recurrence = null; 
					if( window.DOMParser ) {
						recurrence = $(this).attr("ows_RecurrenceData");
					}
					else {
						recurrence = new ActiveXObject( "Microsoft.XMLDOM" );
						recurrence.loadXML($(this).attr("ows_RecurrenceData")); 
					}		
					
					
					if($(recurrence).find("daily").attr("weekday")) {
						weekDayOccurrence($(this));
					}
					else if($(recurrence).find("daily").attr("dayFrequency")) {
						dayOccurrence($(this), recurrence);
					}
					else if ($(recurrence).find("weekly").attr("weekFrequency")) {
						weekOccurrence($(this), recurrence);
					}
					else if($(recurrence).find("monthly").attr("monthFrequency")) {
						monthOccurrence($(this), recurrence);
					}					
					else if($(recurrence).find("monthlyByDay").attr("monthFrequency")) {
						monthByDayOccurrence($(this), recurrence);
					}
					else if($(recurrence).find("yearly").attr("yearFrequency")) {
						yearOccurrence($(this), recurrence);
					}
					else if($(recurrence).find("yearlyByDay").attr("yearFrequency")) {
						yearByDayOccurrence($(this), recurrence);
					}
					else {
						notRecurrenceEvent($(this));
					}
				});
			}
		});
	});
}

function notRecurrenceEvent(data) {
	var dateStart = Date.parse($(data).attr("ows_EventDate"));
	var dateEnd = Date.parse($(data).attr("ows_EndDate"));
	var loc = $(data).attr("ows_Location");
	if (loc) {
		loc = " (" + loc + ")";
	}
	else {
		loc = "";
	}
	var desc = $(data).attr("ows_Description");
	var title = $(data).attr("ows_Title") + loc;
	var color = "blue";

	if (dateStart.compareTo(dateEnd) != 0) {
		eventSource.add(new Timeline.DefaultEventSource.Event({
			start: dateStart,
			end: dateEnd,
			instant: false,
			text: title,
			description: "<b>Description: </b>" + desc,
			color: color
		}));
	}
	else {
		eventSource.add(new Timeline.DefaultEventSource.Event({
			start: dateStart,
			instant: true,
			text: title,
			description: "<b>Description: </b>" + desc,
			color: color
		}));
	}

	tl.paint();

}

function dayOccurrence(data, recurrence) {
	
	var dateStart = Date.parse($(data).attr("ows_EventDate"));
	var dateEnd = Date.parse($(data).attr("ows_EndDate"));
	var loc = $(data).attr("ows_Location");
	if (loc) {
		loc = " (" + loc + ")";
	}
	else {
		loc = "";
	}
	var desc = $(data).attr("ows_Description");
	var title = $(data).attr("ows_Title") + loc;
	var color = "blue";
	
	var numberOfRecurrences = $(recurrence).find("repeatInstances").text();
	
	if(numberOfRecurrences === "" || numberOfRecurrences > maxOccurence) {
		if (dateStart.compareTo(Date.today()) < 0) {
			dateStart = Date.today();
		}
		numberOfRecurrences = maxOccurence;
	}
	
	var frequency = $(recurrence).find("daily").attr("dayFrequency");
	
	for(var i = 0; i < numberOfRecurrences; i++) {
		dateStart.add(frequency).days();
		
		var date = new Date(dateStart.getFullYear(), dateStart.getMonth(), dateStart.getDate(), dateStart.getHours(), dateStart.getMinutes(), 0, 0);
			
		if (date.compareTo(dateEnd) > 0) {
			break;
		}
		
		eventToeventsource(date, title, desc, color);
	}
}

function weekDayOccurrence(data) {
	var dateStart = Date.parse($(data).attr("ows_EventDate"));
	var dateEnd = Date.parse($(data).attr("ows_EndDate"));
	var loc = $(data).attr("ows_Location");
	if (loc) {
		loc = " (" + loc + ")";
	}
	else {
		loc = "";
	}
	var desc = $(data).attr("ows_Description") + loc;

	var title = $(data).attr("ows_Title");
	var color = "blue";
	
	var numberOfRecurrences = Math.floor((dateEnd.getTime() - dateStart.getTime()) / 86400000);
	
	if(numberOfRecurrences === "" || numberOfRecurrences > maxOccurence) {
		if (dateStart.compareTo(Date.today()) < 0) {
			dateStart = Date.today();
		}
		numberOfRecurrences = maxOccurence;
	}
	
	var frequency = 1;
	
	for(var i = 0; i < numberOfRecurrences; i++) {
		dateStart.add(frequency).days();
		if(dateStart.getDay() == 6) {
			dateStart.add(2).days();
		}
		else if (dateStart.getDay() == 0) {
			dateStart.add(1).days();
		}
		var date = new Date(dateStart.getFullYear(), dateStart.getMonth(), dateStart.getDate(), dateStart.getHours(), dateStart.getMinutes(), 0, 0);
		
		if (date.compareTo(dateEnd) > 0) {
			break;
		}
		
		eventToeventsource(date, title, desc, color);

	}
}

function isInArray(array, obj) {
    for (var i = 0; i < array.length; i++) {
    	if (array[i] === obj) {
        	return i;
      	}
    }
    return -1;
}

function weekOccurrence(data, recurrence) {
	var dateStart = Date.parse($(data).attr("ows_EventDate"));
	var dateEnd = Date.parse($(data).attr("ows_EndDate"));
	var loc = $(data).attr("ows_Location");
	if (loc) {
		loc = " (" + loc + ")";
	}
	else {
		loc = "";
	}
	var desc = $(data).attr("ows_Description");
	var title = $(data).attr("ows_Title") + loc;
	var color = "blue";
	 
	var numberOfRecurrences = $(recurrence).find("repeatInstances").text();
	
	if(numberOfRecurrences === "" || numberOfRecurrences > maxOccurence) {
		if (dateStart.compareTo(Date.today()) < 0) {
			dateStart = Date.today();
		}
		numberOfRecurrences = maxOccurence;
	}
	
	var frequency = $(recurrence).find("weekly").attr("weekFrequency");
	var weekday = dayOfWeek($(recurrence).find("weekly"));
	
	var tempdate = new Date(dateStart.getFullYear(), dateStart.getMonth(), dateStart.getDate(), dateStart.getHours(), dateStart.getMinutes(), 0, 0);

	for(var i = 0; i < numberOfRecurrences; i++) {
		var tempWeekday = 1;
		var weekdayIndex = isInArray(weekday, tempdate.getDay());
			if(weekdayIndex  >= 0) {
				var date = new Date(tempdate.getFullYear(), tempdate.getMonth(), tempdate.getDate(), tempdate.getHours(), tempdate.getMinutes(), 0, 0);
				if (date.compareTo(dateEnd) > 0) {
					break;
				}		
				eventToeventsource(date, title, desc, color);				
			}
			else {
				i--;			
			}	

		if(weekday[weekdayIndex+1] === null && weekday[weekdayIndex] != 0) {
			tempdate.add(weekday[weekdayIndex]).days();
		}
		else {
			tempdate.add(tempWeekday).days();
		}
	}
}

function monthOccurrence(data, recurrence) {
	var dateStart = Date.parse($(data).attr("ows_EventDate"));
	var dateEnd = Date.parse($(data).attr("ows_EndDate"));
	var loc = $(data).attr("ows_Location");
	if (loc) {
		loc = " (" + loc + ")";
	}
	else {
		loc = "";
	}
	var desc = $(data).attr("ows_Description");
	var title = $(data).attr("ows_Title") + loc;
	var color = "blue";
	 
	var numberOfRecurrences = $(recurrence).find("repeatInstances").text();
	
	if(numberOfRecurrences === "" || numberOfRecurrences > maxOccurence) {
		if (dateStart.compareTo(Date.today()) < 0) {
			dateStart = Date.today();
		}
		numberOfRecurrences = maxOccurence;
	}
	
	var frequency = $(recurrence).find("monthly").attr("monthFrequency");
	var day = $(recurrence).find("monthly").attr("day");
	var tempdate = dateStart;
	for(var i = 0; i < numberOfRecurrences; i++) {
		var date = new Date(tempdate.getFullYear(), tempdate.getMonth(), day, tempdate.getHours(), tempdate.getMinutes(), 0, 0);
		
		if (date.compareTo(dateEnd) > 0) {
			break;
		}
		
		eventToeventsource(date, title, desc, color);
		
		tempdate = dateStart.add(frequency).month();
	}
}

function monthByDayOccurrence(data, recurrence) {
	var dateStart = Date.parse($(data).attr("ows_EventDate"));
	var dateEnd = Date.parse($(data).attr("ows_EndDate"));
	var loc = $(data).attr("ows_Location");
	if (loc) {
		loc = " (" + loc + ")";
	}
	else {
		loc = "";
	}
	var desc = $(data).attr("ows_Description");
	var title = $(data).attr("ows_Title") + loc;
	var color = "blue";


	var numberOfRecurrences = $(recurrence).find("repeatInstances").text();
	
	if(numberOfRecurrences === "" || numberOfRecurrences > maxOccurence) {
		if (dateStart.compareTo(Date.today()) < 0) {
			dateStart = Date.today();
		}
		numberOfRecurrences = maxOccurence;
	}
	
	var frequency = $(recurrence).find("monthlyByDay").attr("monthFrequency");
	var weekday = dayOfWeek($(recurrence).find("monthlyByDay"));

	var weekNo = weekOfMonth($(recurrence).find("monthlyByDay").attr("weekdayOfMonth"));
	var tempdate = dateStart;
	for(var i = 0; i < numberOfRecurrences; i++) {
		if(dayOfWeek($(recurrence).find("monthlyByDay").attr("weekend_day"))) {
			if (tempdate.getDay() == 0) {
				weekday[0] = 0;
			}
			else {
				weekday[0] = 6;
			}
		}
		var firstDay = new Date(tempdate.getFullYear(), tempdate.getMonth(), 1, tempdate.getHours(), tempdate.getMinutes(), 0, 0);
		var day = 1 + (weekday[0] - firstDay.getDay() + 7) % 7;
		day = day + (weekNo * 7);
		if(Date.getDaysInMonth(tempdate.getFullYear(), tempdate.getMonth()) <= day) {
			day -= 7;
		}
		var date = new Date(tempdate.getFullYear(), tempdate.getMonth(), day, tempdate.getHours(), tempdate.getMinutes(), 0, 0);
		
		if (date.compareTo(dateEnd) > 0) {
			break;
		}
		
		eventToeventsource(date, title, desc, color);
		tempdate = dateStart.add(frequency).month();
	}
}

function yearOccurrence(data, recurrence) {
	var dateStart = Date.parse($(data).attr("ows_EventDate"));
	var dateEnd = Date.parse($(data).attr("ows_EndDate"));
	var loc = $(data).attr("ows_Location");
	if (loc) {
		loc = " (" + loc + ")";
	}
	else {
		loc = "";
	}
	var desc = $(data).attr("ows_Description");
	var title = $(data).attr("ows_Title") + loc;
	var color = "blue";
	 
	var numberOfRecurrences = $(recurrence).find("repeatInstances").text();
	
	if(numberOfRecurrences === "" || numberOfRecurrences > maxOccurence) {
		if (dateStart.compareTo(Date.today()) < 0) {
			dateStart = Date.today();
		}
		numberOfRecurrences = maxOccurence;
	}
	
	var frequency = $(recurrence).find("yearly").attr("yearFrequency");
	var day = $(recurrence).find("yearly").attr("day");
	var month = $(recurrence).find("yearly").attr("month") -1;
	var tempdate = new Date(dateStart.getFullYear(), month, day, dateStart.getHours(), dateStart.getMinutes(), 0, 0)
	if(tempdate.compareTo(dateStart) >= 0) {
		tempdate.setYear(dateStart.getFullYear() -1);
	}
	for(var i = 0; i < numberOfRecurrences; i++) {
		tempdate.add(frequency).year();
		var date = new Date(tempdate.getFullYear(), tempdate.getMonth(), tempdate.getDate(), tempdate.getHours(), tempdate.getMinutes(), 0, 0);
		
		if (date.compareTo(dateEnd) > 0) {
			break;
		}
		
		eventToeventsource(date, title, desc, color);
	}
}

function yearByDayOccurrence(data, recurrence) {
	var dateStart = Date.parse($(data).attr("ows_EventDate"));
	var dateEnd = Date.parse($(data).attr("ows_EndDate"));
	var loc = $(data).attr("ows_Location");
	if (loc) {
		loc = " (" + loc + ")";
	}
	else {
		loc = "";
	}
	var desc = $(data).attr("ows_Description");
	var title = $(data).attr("ows_Title") + loc;
	var color = "blue";
	 

	var numberOfRecurrences = $(recurrence).find("repeatInstances").text();
	
	if(numberOfRecurrences === "" || numberOfRecurrences > maxOccurence) {
		if (dateStart.compareTo(Date.today()) < 0) {
			dateStart = Date.today();
		}
		numberOfRecurrences = maxOccurence;
	}
	
	var frequency = $(recurrence).find("yearlyByDay").attr("yearFrequency");
	var weekday = dayOfWeek($(recurrence).find("yearlyByDay"));
	var weekNo = weekOfMonth($(recurrence).find("yearlyByDay").attr("weekdayOfMonth"));
	var month = $(recurrence).find("yearlyByDay").attr("month") -1;
	
	var firstDay = new Date(dateStart.getFullYear(), dateStart.getMonth(), 1);
	var day = 1 + (weekday[0] - firstDay.getDay() + 7) % 7;
	day = day + (weekNo * 7);
	
	var tempdate = new Date(dateStart.getFullYear(), month, day)
	if(tempdate.compareTo(dateStart) >= 0) {
		tempdate.setYear(dateStart.getFullYear() -1);
	}
	for(var i = 0; i < numberOfRecurrences; i++) {
		tempdate.add(frequency).year();
		firstDay = new Date(tempdate.getFullYear(), month, 1);
		day = 1 + (weekday[0] - firstDay.getDay() + 7) % 7;
		day = day + (weekNo * 7);
		var temp = day;
		var date = new Date(tempdate.getFullYear(), tempdate.getMonth(), temp, dateStart.getHours(), dateStart.getMinutes(), 0, 0);
		if (date.compareTo(dateEnd) > 0) {
			break;
		}
		eventToeventsource(date, title, desc, color);		
	}
}

function weekOfMonth(weekdayOfMonth) {
	switch(weekdayOfMonth) {
		case "first": return 0; break;
		case "second": return 1; break;
		case "third": return 2; break;
		case "fourth": return 3; break;
		case "last": return 4; break;
	}
}

function dayOfWeek(days) {
	var daysArray = new Array();
	if($(days).attr("mo")) { daysArray.push(1) };
	if($(days).attr("tu")) { daysArray.push(2) };
	if($(days).attr("we")) { daysArray.push(3) };
	if($(days).attr("th")) { daysArray.push(4) };
	if($(days).attr("fr")) { daysArray.push(5) };
	if($(days).attr("sa")) { daysArray.push(6) };
	if($(days).attr("su")) { daysArray.push(0) };
	return daysArray;
}
