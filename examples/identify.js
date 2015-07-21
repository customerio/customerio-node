var CIO = require('../lib/customerio-node');
var siteId = require('./config').siteId;
var apiKey = require('./config').apiKey;
var cio = new CIO(siteId, apiKey);
var customerId = 'alvin@customer.io';

cio.identify(customerId, { adventure_time_fav: 'jake'  }).
  then(function(){
    var data = {
      name: 'updated',
      data: {
        updated: true,
        plan: 'free'
      }
    };
    cio.track(customerId, data);
  });
