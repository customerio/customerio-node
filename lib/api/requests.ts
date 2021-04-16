type Message = {
  [key: string]: unknown;
  headers: Record<string, string>;
  attachments: Record<string, unknown>;
};

const REQUIRED_FIELDS = Object.freeze(['to', 'identifiers']);
const OPTIONAL_FIELDS = Object.freeze([
  'transactional_message_id',
  'message_data',
  'headers',
  'preheader',
  'from',
  'reply_to',
  'bcc',
  'subject',
  'body',
  'plaintext_body',
  'amp_body',
  'fake_bcc',
  'disable_message_retention',
  'send_to_unsubscribed',
  'tracked',
  'queue_draft',
]);

export class SendEmailRequest {
  message: Message;

  constructor(opts: Record<string, unknown>) {
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

  // Use `any` for data here, because union types and overloads in Typescript
  // don't work well together.
  attach(name: string, data: any, { encode = true } = {}) {
    if (this.message.attachments[name]) {
      throw new Error(`attachment ${name} already exists`);
    }

    if (encode) {
      this.message.attachments[name] = Buffer.from(data).toString('base64');
    } else {
      this.message.attachments[name] = data;
    }
  }
}
