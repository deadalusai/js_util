/*
 * Queryable - a simple jQuery utility to make writing REST/JSON queries easier
 *
 *  - Simple url bindings - no more concatenating url strings!
 *  - Automatic header inclusion
 *  - Easy OData query support
 *  - Automatic JSON serialization
 */

(function (scope, ajax) {
	function each(obj, callback) {
		for (var name in obj) {
			callback(name, obj[name]);
		}
	}

	var r_name = /{([a-z]+)}/ig;

	function format(fmt, args) {
		return (typeof fmt === 'string') ? fmt.replace(r_name, function(p, name) { return args[name] || ''; }) : fmt;
	}

	function make(method) {
		method = method.toUpperCase();

	  	/*
	 	var query = {
	 		//Serialized to JSON and sent as message body
			'data': object,

			//Additional headers can be defined here as a key/value map
			'headers': object,

			//Any other property can be used in url or header binding
			'{name}': string | number
	 	};
	  	*/

		return function (url_pattern, query) {
			query = query || {};
			var settings = { type: method, dataType: 'json' };

			if (method !== 'GET' && query.data) {
				settings.data = JSON.stringify(query.data);
				settings.contentType = 'application/json';
			}

			//process headers
			settings.headers = {};
			function add_header(name, header) { 
				header = (typeof header === 'function') ? header() : header;
				if (header) { settings.headers[name] = format(header, query); }
			};
			each(this.headers, add_header); 
		  	each(query.headers, add_header);

			//trim leading /
			if (url_pattern.substring(0, 1) === '/') {
				url_pattern = url_pattern.substring(1);
			}
			
			//data-bind the url_pattern url
			url_pattern = format(url_pattern, query);

			return ajax(this.api_endpoint + url_pattern, settings);
		};
	}

	var Queryable = function (api_endpoint, headers) {
  	//append trailing /
		if (api_endpoint[api_endpoint.length - 1] !== '/') {
			api_endpoint += '/';
		}

		this.api_endpoint = api_endpoint;
		this.headers = headers;
	};

	Queryable.prototype = {
	  get: make('get'),
	  post: make('post'),
	  put: make('put'),
	  del: make('delete')
	};

	scope.Queryable = Queryable;
})(window, jQuery.ajax);