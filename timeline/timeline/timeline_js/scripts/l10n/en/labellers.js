/*==================================================
 *  Localization of labellers.js
 *==================================================
 */

Timeline.GregorianDateLabeller.monthNames["en"] = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

/*Timeline.GregorianDateLabeller.dayNames["en"] = [
    "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
];*/

Timeline.GregorianDateLabeller.dayNames["en"] = [
    "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"
];


Timeline.GregorianDateLabeller.getDayName = function(day, locale) {
	return Timeline.GregorianDateLabeller.dayNames[locale][day];
}

Timeline.GregorianDateLabeller.labelIntervalFunctions["en"] = function(date, intervalUnit) {
    var text;
    var emphasized = false;

    var date2 = Timeline.DateTime.removeTimeZoneOffset(date, this._timeZone);
    
    switch(intervalUnit) {
    /*case Timeline.DateTime.DAY:
    	text = date2.getUTCDate() + ". " + (date2.getUTCMonth() + 1);
    	break;*/
    case Timeline.DateTime.DAY:
	    text = Timeline.GregorianDateLabeller.getDayName( date2.getDay(), this._locale) + 
	    "<br />" + String("00" + date2.getDate()).slice(-2) + "." + String("00" + (date2.getMonth() + 1)).slice(-2) + "." + date2.getFullYear();
    	break;
    case Timeline.DateTime.WEEK:
        //text = date2.getUTCDate() + ". " + (date2.getUTCMonth() + 1) + ".";
        text = date2.getWeekOfYear();
        break;
    default:
        return this.defaultLabelInterval(date, intervalUnit);
    }
    
    return { text: text, emphasized: emphasized };
};
