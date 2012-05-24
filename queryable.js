/*
 * Queryable - a simple jQuery utility to make writing REST/JSON queries easier
 *
 *  - Simple url bindings - no more concatenating url strings!
 *  - Automatic header inclusion
 *  - Easy OData query support
 *  - Automatic JSON serialization
 */

(function (scope, $) {
	function build_headers_from(definitions) {
		if (!definitions) { return; }

		var h = {}, def, name, i;

		function add (name, def) {
			def = (typeof def === 'function') ? def() : def;
			if (def) { h[name] = def; }
		}
		
		if ($.isArray(definitions)) {
			for (i = 0; i < definitions.length; i++) {
				def = definitions[i].split('=');
				add(def[0], def[1]);
			}
		}
		else {
			for (name in definitions) {
				def = definitions[name];
				add(name, def);
			}
		}
		return h;
	}

	function build_odata_querystring(query) {
		
	}

	function make_query_method(method) {
		method = method.toUpperCase();

		 /*
		 	var query = {
	 			//Odata bindings, $filter, $orderBy, $top, $skip
				'${name}': function | string,

				//Serialized to JSON and sent as message body
				'data': object,

				//Additional headers can be defined here as a key/value map
				'headers': object,

				//Any other property can be used in url binding
				'{name}': string | number
	 		};
		 */

		return function (endpoint, query) {
			var settings = { type: method, dataType: 'json' };

			if (method !== 'GET' && query.data) {
				settings.data = JSON.stringify(query.data);
				settings.contentType = 'application/json';
			}

			//trim leading /
			if (endpoint.substring(0, 1) === '/') {
				endpoint = endpoint.substring(1);
			}

			//parse headers
			settings.headers = $.extend({},
				build_headers_from(this.headers), 
				build_headers_from(query.headers)
			);

			//parse odata queryables
			var odata = build_odata_querystring(query);
			
			//data-bind the endpoint url
			endpoint = endpoint.replace(r_name, function (p, prop) { return query[prop]; });

			return $.ajax(this.api_endpoint + endpoint, settings);
		};
	}

	var r_name = /{([a-z]+)}/ig;

	var Queryable = function (api_endpoint, headers) {
	  	//append trailing /
		if (api_endpoint[api_endpoint.length - 1] !== '/') {
			api_endpoint += '/';
		}

		this.api_endpoint = api_endpoint;
		this.headers = headers;
	};

	Queryable.prototype = {
	  get: make_query_method('get'),
	  post: make_query_method('post'),
	  put: make_query_method('put'),
	  del: make_query_method('delete')
	};

	scope.Queryable = Queryable;
})(window, jQuery);