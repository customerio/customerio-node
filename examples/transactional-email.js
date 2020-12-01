const fs = require('fs');

// In actual use require the node module: let APIClient = require('customerio-node/api');
const APIClient = require('../lib/api');
const SendEmailRequest = require('../lib/transactional-email');
const { appKey, transactionalMessageId, customerId, customerEmail } = require('./config');

const api = new APIClient(appKey);

// Create a message: "to" is a required field.
let message = new SendEmailRequest({
  to: customerEmail,

  // Optionally, send a `customer_id`. If your message uses customer variables,
  // they will be replaced by this customer's attributes.
  customer_id: customerId,

  // Optionally, send a `message_data` object with values that should replace
  // placeholders in your message body.
  message_data: {
    token: 'abc123',
  },

  // Use a transactional_message_id if you have created a transactional message
  // within Customer.io.  Otherwise, pass in `from`, `to`, `subject`, and
  // `body` to create a message.
  transactional_message_id: transactionalMessageId,

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

  hide_body: false, // Hides the message body from displaying in Customer.io when viewing deliveries.
});

// To send attachments with the message, pass in a pathname or a Buffer
// object.
message.attach('attachment-1', 'attachment-1.pdf');
message.attach('attachment-2', fs.readFileSync('attachment-2.pdf'));

api.sendEmail(message).catch((err) => console.log(err.message, err.statusCode));
