const fs = require('fs');

const REQUIRED_FIELDS = Object.freeze(['to', 'identifiers']);
const OPTIONAL_FIELDS = Object.freeze([
  'transactional_message_id',
  'message_data',
  'from',
  'from_id',
  'reply_to',
  'reply_to_id',
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
    let message = {
      headers: {},
      attachments: {},
    };

    REQUIRED_FIELDS.forEach((field) => {
      message[field] = opts[field];
    });

    OPTIONAL_FIELDS.forEach((field) => {
      message[field] = opts[field];
    });

    this._message = message;
  }

  get message() {
    return Object.freeze(this._message);
  }

  attach(name, data) {
    if (data instanceof Buffer) {
      this._message.attachments[name] = data.toString('base64');
    } else if (typeof data === 'string') {
      this._message.attachments[name] = fs.readFileSync(data, 'base64');
    } else {
      throw new Error(`unknown attachment type: ${typeof data}`);
    }
  }
}

module.exports = {
  SendEmailRequest,
};
