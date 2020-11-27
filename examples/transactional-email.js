// In actual use require the node module: let APIClient = require('customerio-node/api');
let APIClient = require('../lib/api');
const { appKey, transactionalMessageId, customerId, customerEmail } = require('./config');

const api = new APIClient(appKey);

api.sendEmail({
  transactional_message_id: transactionalMessageId,
  to: customerEmail,
  customer_id: customerId,
  message_data: {
    token: 'abc123',
  },
});
