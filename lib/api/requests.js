const fs = require('fs');

const REQUIRED_FIELDS = Object.freeze(['to', 'identifiers']);
const OPTIONAL_FIELDS = Object.freeze([
  'transactional_message_id',
  'message_data',
  'from',
  'reply_to',
  'bcc',
  'subject',
  'body',
  'plaintext_body',
  'amp_body',
  'fake_bcc',
  'hide_body',
]);

class SendEmailRequest {
  constructor(opts) {
    this.message = {
      headers: {},
      attachments: {},
    };

    REQUIRED_FIELDS.forEach((field) => {
      this.message[field] = opts[field];
    });

    OPTIONAL_FIELDS.forEach((field) => {
      this.message[field] = opts[field];
    });
  }

  attach(name, data) {
    if (data instanceof Buffer) {
      this.message.attachments[name] = data.toString('base64');
    } else if (typeof data === 'string') {
      this.message.attachments[name] = fs.readFileSync(data, 'base64');
    } else {
      throw new Error(`unknown attachment type: ${typeof data}`);
    }
  }
}

module.exports = {
  SendEmailRequest,
};
