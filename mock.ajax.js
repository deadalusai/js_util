var http = require('http');

function make_regexer(pattern) {
  return function (input) { 
    pattern.lastIndex = 0; 
    return pattern.exec(input); 
  }
}

function fix_path(url) {
  //[host, name1=value&name2=value]
  var parts = url.split('?');

  if (typeof parts[1] === 'string') {
    //[name1=value, name2=value, ...]
    var query = parts[1].split('&');

    for (var i = 0; i < query.length; i++) {
      //[name1, value]
      var pair = query[i].split('=');

      if (typeof pair[1] === 'string') {
        query[i] = pair[0] + '=' + encodeURIComponent(pair[1]);
      }
    }
    parts[1] = query.join('&');
  }
  return parts.join('?');
}

var r_url = make_regexer(/^(https?)\:\/\/([a-z-_]+(?:\.[a-z-_]+)*)(?::(\d+))?(\/[^\?]+)?(\?.*)?$/ig);

function get_parts(url) {
  var m = r_url(url);
  if (!m) {
    throw 'Could not parse url ' + url;
  }
  return { scheme: m[1], host: m[2],  port: m[3] || 80, path: m[4] || '', query: m[5] || '' };
}

var proxy_settings = { host: null, port: null };

module.exports = {
  proxy: proxy_settings,
  ajax: function(url, settings) {
    var error_callbacks = [], success_callbacks = [];
    var url = fix_path(url);
    var parts = get_parts(url);

    var req_settings = {
      path: url,
      host: proxy_settings.host || parts.host,
      port: proxy_settings.port || parts.port, 
      method: settings.type,
      headers: settings.headers
    };

    if (settings.contentType) {
      req_settings.headers['Content-Type'] = setting.contentType;
    }

    console.log(settings.type, url);

    var req = http.request(req_settings, function(res) {
      var data = '';
      res.on('data', function (chunk) { data += chunk.toString(); });
      res.on('end', function () {
        if (res.statusCode === 200) {
          if (data && settings.dataType === 'json') { 
            data = JSON.parse(data); 
          }
          for (var i = 0; i < success_callbacks.length; i++) {
            success_callbacks[i](data, res.statusCode);
          }
        }
        else {
          for (var i = 0; i < error_callbacks.length; i++) {
            error_callbacks[i]('error', res.statusCode, data);
          }
        }
      });
    });

    if (settings.data) {
      req.write(settings.data);
    }
    req.end();

    return {
      error: function(fn) { error_callbacks.push(fn); },
      success: function(fn) { success_callbacks.push(fn); }
    };
  } 
};