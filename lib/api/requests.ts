export type Identifiers = { id: string | number } | { email: string };

export type SendEmailRequestRequiredOptions = {
  to: string;
  identifiers: Identifiers;
};

export type SendEmailRequestOptionalOptions = Partial<{
  message_data: Record<string, any>;
  headers: Record<string, any>;
  preheader: string;
  reply_to: string;
  bcc: string;
  plaintext_body: string;
  amp_body: string;
  fake_bcc: boolean;
  disable_message_retention: boolean;
  send_to_unsubscribed: boolean;
  tracked: boolean;
  queue_draft: boolean;
  send_at: number;
}>;

export type SendEmailRequestWithTemplate = SendEmailRequestRequiredOptions &
  SendEmailRequestOptionalOptions & {
    transactional_message_id: string | number;
  };

export type SendEmailRequestWithoutTemplate = SendEmailRequestRequiredOptions &
  SendEmailRequestOptionalOptions & {
    body: string;
    subject: string;
    from: string;
  };

export type SendEmailRequestOptions = SendEmailRequestWithTemplate | SendEmailRequestWithoutTemplate;

export type Message = Partial<SendEmailRequestWithTemplate & SendEmailRequestWithoutTemplate> & {
  attachments: Record<string, string>;
};
export class SendEmailRequest {
  message: Message;

  constructor(opts: SendEmailRequestOptions) {
    this.message = {
      to: opts.to,
      identifiers: opts.identifiers,
      attachments: {},
      message_data: opts.message_data,
      headers: opts.headers || {},
      preheader: opts.preheader,
      reply_to: opts.reply_to,
      bcc: opts.bcc,
      plaintext_body: opts.plaintext_body,
      amp_body: opts.amp_body,
      fake_bcc: opts.fake_bcc,
      disable_message_retention: opts.disable_message_retention,
      send_to_unsubscribed: opts.send_to_unsubscribed,
      tracked: opts.tracked,
      queue_draft: opts.queue_draft,
      send_at: opts.send_at,
    };

    if ('transactional_message_id' in opts) {
      this.message.transactional_message_id = opts.transactional_message_id;
    }

    if ('from' in opts) {
      this.message.from = opts.from;
    }

    if ('subject' in opts) {
      this.message.subject = opts.subject;
    }

    if ('body' in opts) {
      this.message.body = opts.body;
    }
  }

  // Use `any` for data here, because union types and overloads in Typescript
  // don't work well together for `Buffer.from`.
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
