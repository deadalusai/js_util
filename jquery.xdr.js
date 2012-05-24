/*
 * jQuery plugin which allows jQuery to utilise IE8/9's XDomainRequest when the request is detected as being 
 * both crossDomain and async
 *  
 *  - XDomainRequest only supports GET and POST, so PUT and DELETE requests are rewritten as POST requests 
 *    with an X-Http-Method header added reflecting the actual method. The server must support this pattern in order to 
 *    use PUT and DELETE
 *  
 *  - XDomainRequest does not support custom headers, so all extra headers are rewritten as query string parameters in 
 *    the form: h_X_Http_Method. The server must support detecting these and treating them as real HTTP headers.
 *
 *  The above features are in place as a hack to get around custom header and method restrictions in XDomainRequest - use 
 *  at your own risk! To disable them, use the following in your startup:
 *
 *    jQuery.ajaxSetup({ xdrUseFakeHeaders: false });
 */
(function (jQuery) {
    if (window.XDomainRequest) {
        jQuery.ajaxSetup({ xdrUseFakeHeaders: true });
        jQuery.ajaxTransport(function (settings) {
            if (settings.crossDomain && settings.async) {
                var xdr, url = settings.url, method = settings.type;

                if (settings.xdrUseFakeHeaders) {,
                    var fakeHeaders = [];
                    //Build a custom header list ** must be supported by the endpoint server **
                    if (settings.contentType) {
                        fakeHeaders.push('h_Content_Type=' + settings.contentType);
                    }
                    if (method) {
                        method = method.toUpperCase();
                        //Convert PUT or DELETE operations into POST ops with an override
                        if (method === 'PUT' || method === 'DELETE') {
                            fakeHeaders.push('h_X_Http_Method=' + method);
                            method = 'POST';
                        }
                    }
                    if (settings.headers) {
                        for (var name in settings.headers) {
                            //rename each custom header in the form: Http-Header-Name => h_Http_Header_Name
                            fakeHeaders.push('h_' + name.replace(/-/ig, '_') + '=' + escape(settings.headers[name]));
                        }
                    }
                    //Push the custom headers onto the query string
                    if (fakeHeaders.length) {
                        var hasQueryString = url.indexOf('?') >= 0;
                        url += (hasQueryString ? '&' : '?') + fakeHeaders.join('&');
                    }
                }

                return {
                    send: function (_, complete) {
                        function callback(status, statusText, responses, responseHeaders) {
                            xdr.onload = xdr.onerror = xdr.ontimeout = xdr.onprogress = jQuery.noop;
                            xdr = null;
                            complete(status, statusText, responses, responseHeaders);
                        }
                        xdr = new XDomainRequest()
                        xdr.open(method, url);
                        xdr.onload = function () { callback(200, "OK", { text: xdr.responseText }, "Content-Type: " + xdr.contentType); };
                        xdr.onerror = function () { callback(404, "Not Found"); };
                        if (settings.timeout) {
                            xdr.ontimeout = function () { callback(0, "timeout"); };
                            xdr.timeout = settings.timeout;
                        }
                        xdr.send((settings.hasContent && settings.data) || null);
                    },
                    abort: function () {
                        if (xdr) {
                            xdr.onerror = jQuery.noop;
                            xdr.abort();
                        }
                    }
                };
            }
        });
    }
})(jQuery);