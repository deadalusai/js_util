/*
 * Provides a static utility function Date.fromIso8601 for converting an ISO 8601 date string into a Date object
 *
 *  - The ISO8601 date string can represent a date/time in any timezone/offset
 *  - The ISO8601 date string will always be converted to a Date in the BROWSER's timezone/offset
 *  - Only complete ISO8601 dates are currently supported, e.g. [date]T[time](Z|[offset])
 */
(function () {
    //2012-04-13T17:41:44.5779471+12:00
    //                1          2         3         4         5         6        7       8      9         10
    var r_iso8601 = /(\d\d\d\d)-(\d{1,2})-(\d{1,2})T(\d{1,2}):(\d{1,2}):(\d{1,2})(\.\d+)?(Z|[-+](\d{1,2}):(\d{1,2}))/;
    
    //Converts a string in full ISO8601 form into a localized Date
    Date.fromIso8601 = function (input) {
        var parts = input.match(r_iso8601)

        if (!parts) {
            throw 'Not recognised as a valid ISO 8601 date/time. Got "' + input + 
                  '", expected something matching the pattern "yyyy-MM-ddThh:mm:ss(.zzz)?(Z|[+-]hh:mm)"';
        }

        function part(i) { return parseInt(parts[i], 10); }

        //convert iso8601 parts into a UTC Date. Each part is parsed as an integer, except for part 7
        var utc = Date.UTC(part(1), part(2) - 1, part(3), part(4), part(5), part(6), parseFloat(parts[7]) * 1000 || 0), offset = 0;

        //Calculate the timezone offset. If the input uses the Z flag then the destination offset_mins is 0
        if (parts[8] != 'Z') {
            //otherwise convert the timezone from [+-]\d\d:\d\d to milliseconds
            offset = (part(9) * 60) + part(10); //minutes
            offset *= 60 * 1000; //milliseconds
            offset *= (parts[8][0] == '-') ? -1 : 1;
        }

        return new Date(utc - offset);
    };

    function pad(n){
        if (n < 0) {
            return n > -10 ? '-0' + (n * -1) : n;
        } else {
            return n < 10 ? '0' + n : n 
        }
    }

    //Converts the Date into a ISO8601 string with the UTC timezone offset
    Date.prototype.toUtcIso8601 = function () {
        var date = [
            this.getUTCFullYear(), '-',
            pad(this.getUTCMonth() + 1), '-',
            pad(this.getUTCDate()), 'T',
            pad(this.getUTCHours()), ':',
            pad(this.getUTCMinutes()), ':',
            pad(this.getUTCSeconds()), 'Z'
        ];

        return date.join('');
    };

    //Converts the Date into a ISO8601 string with the browser timezone offset
    Date.prototype.toIso8601 = function () {
        var offset = -1 * this.getTimezoneOffset();
        offset = (offset < 0 ? '' : '+') + pad(offset / 60) + ':' + pad(offset % 60);

        var date = [
            this.getFullYear(), '-',
            pad(this.getMonth() + 1), '-',
            pad(this.getDate()), 'T',
            pad(this.getHours()), ':',
            pad(this.getMinutes()), ':',
            pad(this.getSeconds()), offset
        ];

        return date.join('');
    };
})();