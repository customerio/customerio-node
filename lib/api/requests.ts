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
  body_plain: string;
  body_amp: string;
  fake_bcc: boolean;
  disable_message_retention: boolean;
  send_to_unsubscribed: boolean;
  tracked: boolean;
  queue_draft: boolean;
  send_at: number;
  disable_css_preprocessing: boolean;
  language: string;
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

export type EmailMessage = Partial<SendEmailRequestWithTemplate & SendEmailRequestWithoutTemplate> & {
  attachments: Record<string, string>;
};

export class SendEmailRequest {
  message: EmailMessage;

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
      body_plain: opts.body_plain,
      body_amp: opts.body_amp,
      fake_bcc: opts.fake_bcc,
      disable_message_retention: opts.disable_message_retention,
      send_to_unsubscribed: opts.send_to_unsubscribed,
      tracked: opts.tracked,
      queue_draft: opts.queue_draft,
      send_at: opts.send_at,
      disable_css_preprocessing: opts.disable_css_preprocessing,
      language: opts.language,
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

export type SendPushCustomPayload = {
  ios: Record<string, any>;
  android: Record<string, any>;
};

export type SendPushRequestRequiredOptions = {
  identifiers: Identifiers;
  transactional_message_id: string | number;
};

export type SendPushRequestOptionalOptions = Partial<{
  to: string;
  title: string;
  message: string;
  disable_message_retention: boolean;
  send_to_unsubscribed: boolean;
  queue_draft: boolean;
  message_data: Record<string, any>;
  send_at: number;
  language: string;
  image_url: string;
  link: string;
  sound: string;
  custom_data: Record<string, any>;
  device: Record<string, any>;
  custom_device: Record<string, any>;
}>;

export type SendPushRequestWithoutCustomPayload = SendPushRequestRequiredOptions & SendPushRequestOptionalOptions & {};

export type SendPushRequestWithCustomPayload = SendPushRequestRequiredOptions &
  SendPushRequestOptionalOptions & {
    custom_payload: SendPushCustomPayload;
  };

export type SendPushRequestOptions = SendPushRequestWithoutCustomPayload | SendPushRequestWithCustomPayload;

export type PushMessage = Partial<
  Omit<SendPushRequestWithoutCustomPayload, 'device'> & Omit<SendPushRequestWithCustomPayload, 'device'>
>;

export class SendPushRequest {
  message: PushMessage;

  constructor(opts: SendPushRequestOptions) {
    this.message = {
      identifiers: opts.identifiers,
      to: opts.to,
      transactional_message_id: opts.transactional_message_id,
      title: opts.title,
      message: opts.message,
      disable_message_retention: opts.disable_message_retention,
      send_to_unsubscribed: opts.send_to_unsubscribed,
      queue_draft: opts.queue_draft,
      message_data: opts.message_data,
      send_at: opts.send_at,
      language: opts.language,
      image_url: opts.image_url,
      link: opts.link,
      sound: opts.sound,
      custom_data: opts.custom_data,
      custom_device: opts.device,
    };

    if ('custom_payload' in opts) {
      this.message.custom_payload = opts.custom_payload;
    }
  }
}
