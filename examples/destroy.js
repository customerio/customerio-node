let CIO = require('../lib/index');
// In actual use require the node module: let CIO = require('customerio-node');
const siteId = require('./config').siteId;
const apiKey = require('./config').apiKey;
const customerId = require('./config').customerId;
const cio = new CIO(siteId, apiKey);

cio.destroy(customerId);
