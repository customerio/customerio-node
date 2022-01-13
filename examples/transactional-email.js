const fs = require('fs');

// In actual use require the node module:
// const { APIClient, SendEmailRequest } = require('customerio-node');
const { APIClient, SendEmailRequest, RegionUS } = require('../dist/index');
const { appKey, transactionalMessageId, customerEmail } = require('./config');

const api = new APIClient(appKey, { region: RegionUS });

// Create a message: "to" is a required field.
let req = new SendEmailRequest({
  to: customerEmail,

  // To identify a customer, send an identifiers object, including an `id`. If
  // your message uses customer variables, they will be replaced by this
  // customer's attributes.
  identifiers: {
    id: 'customer_id',
  },

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
  reply_to: '',
  bcc: '',
  subject: '',
  body: '',
  plaintext_body: '',
  amp_body: '',
  fake_bcc: false,

  disable_message_retention: false,
  send_to_unsubscribed: false,
  tracked: false,
  queue_draft: false,
});

// To send attachments with the message, pass in a string or a Buffer object.
req.attach('attachment-2', fs.readFileSync('attachment-2.pdf'));

// The `attach` helper method will encode the file's contents as a base64 string.
// If you have an already encoded value, you can pass an options object with encode
// set to false.
req.attach('attachment-2', fs.readFileSync('attachment-2.pdf'), { encode: false });

api.sendEmail(req).catch((err) => console.log(err.message, err.statusCode));
