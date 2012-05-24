//define some globals
window = {};
jQuery = require('./mock.ajax.js');

jQuery.proxy.host = '127.0.0.1';
jQuery.proxy.port = 8888;

require('./queryable.js');

var q = new window.Queryable('http://stbda-services-test.cloudapp.net/api', { 'X-Stbda-Auth': 1 });

var ajax = q.get('claims');

ajax.error(function (status, code, error) { console.log('Error:', code, status, error); });
ajax.success(function (claims) {
  console.log('Found', claims.length, 'claims');

  for (var i = 0; i < claims.length; i++) {
    (function(claim) {
      var ajax = q.get('claims/{claimId}/expenses?$filter=CategoryTitle eq \'{categoryTitle}\'', { claimId: claim.ClaimId, categoryTitle: 'prius' });

      ajax.error(function (status, code, error) { console.log('Error:', code, status, error); });
      ajax.success(function (expenses) {
        console.log('Claim for "' + claim.Purpose + '" has', expenses.length, 'prius expenses');
      });
    })(claims[i]);
  }
});