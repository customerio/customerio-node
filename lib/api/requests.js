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
    REQUIRED_FIELDS.forEach((field) => {
      this[field] = opts[field];
    });

    OPTIONAL_FIELDS.forEach((field) => {
      this[field] = opts[field];
    });

    this.headers = {};
    this.attachments = {};
  }

  attach(name, data) {
    if (data instanceof Buffer) {
      this.attachments[name] = data.toString('base64');
    } else if (typeof data === 'string') {
      this.attachments[name] = fs.readFileSync(data, 'base64');
    } else {
      throw new Error(`unknown attachment type: ${typeof data}`);
    }
  }

  toObject() {
    let attrs = {
      attachments: this.attachments,
      headers: this.headers,
    };

    [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].forEach((prop) => {
      attrs[prop] = this[prop];
    });

    return attrs;
  }
}

module.exports = {
  SendEmailRequest,
};
