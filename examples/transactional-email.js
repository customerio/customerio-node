const fs = require('fs');

// In actual use require the node module: let APIClient = require('customerio-node/api');
const APIClient = require('../lib/api');
const { appKey, transactionalMessageId, customerId, customerEmail } = require('./config');

const api = new APIClient(appKey);

// Create a message: "to" is a required field. "message_data" contains the values that should
// replace placeholders in your template. Learn more at https://customer.io/docs/transactional-api
let message = {
  to: customerEmail,
  transactional_message_id: transactionalMessageId,
  customer_id: customerId,
  message_data: {
    token: 'abc123',
  },
  attachments: {},
  headers: {},
  from: '',
  from_id: 0,
  reply_to: '',
  reply_to_id: 0,
  bcc: '',
  subject: '',
  body: '',
  plaintext_body: '',
  amp_body: '',
  fake_bcc: '',
  hide_body: false,
};

// To send attachments with the message, add a base64 representation of the
// file to the attachments object.
['attachment-1.pdf', 'attachment-2.pdf'].forEach((fileName) => {
  message.attachments[fileName] = fs.readFileSync(fileName, 'base64');
});

api.sendEmail(message).catch((err) => console.log(err.message, err.statusCode));
