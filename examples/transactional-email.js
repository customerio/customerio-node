let CustomerioAPI = require('../lib/api');
// In actual use require the node module: let CustomerioAPI = require('customerio-node/api');
const { appKey, transactionalMessageId, customerId, customerEmail } = require('./config');

const api = new CustomerioAPI(appKey);

api.sendEmail({
  transactional_message_id: transactionalMessageId,
  to: customerEmail,
  customer_id: customerId,
  message_data: {
    token: 'abc123',
  },
});
