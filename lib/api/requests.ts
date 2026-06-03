import { pickDefined } from '../utils';

const SEND_EMAIL_BRAND = Symbol.for('customerio-node.SendEmailRequest');
const SEND_PUSH_BRAND = Symbol.for('customerio-node.SendPushRequest');
const SEND_SMS_BRAND = Symbol.for('customerio-node.SendSMSRequest');
const SEND_INBOX_MESSAGE_BRAND = Symbol.for('customerio-node.SendInboxMessageRequest');
const SEND_IN_APP_BRAND = Symbol.for('customerio-node.SendInAppRequest');

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
  body: string;
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
  attachments?: Record<string, string>;
};

const EMAIL_OPTIONAL_KEYS = [
  'message_data',
  'preheader',
  'reply_to',
  'bcc',
  'body_plain',
  'body_amp',
  'fake_bcc',
  'disable_message_retention',
  'send_to_unsubscribed',
  'tracked',
  'queue_draft',
  'send_at',
  'disable_css_preprocessing',
  'language',
] as const satisfies ReadonlyArray<keyof SendEmailRequestOptionalOptions>;

export class SendEmailRequest {
  message: EmailMessage;

  static [Symbol.hasInstance](instance: unknown): instance is SendEmailRequest {
    return typeof instance === 'object' && instance !== null && (instance as any)[SEND_EMAIL_BRAND] === true;
  }

  constructor(opts: SendEmailRequestOptions) {
    Object.defineProperty(this, SEND_EMAIL_BRAND, { value: true });
    this.message = {
      to: opts.to,
      identifiers: opts.identifiers,
      headers: opts.headers || {},
      ...pickDefined(opts, EMAIL_OPTIONAL_KEYS),
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
    this.message.attachments ??= {};

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
  custom_data: Record<string, string>;
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

const PUSH_OPTIONAL_KEYS = [
  'to',
  'title',
  'message',
  'disable_message_retention',
  'send_to_unsubscribed',
  'queue_draft',
  'message_data',
  'send_at',
  'language',
  'image_url',
  'link',
  'sound',
  'custom_data',
] as const satisfies ReadonlyArray<keyof SendPushRequestOptionalOptions>;

export class SendPushRequest {
  message: PushMessage;

  static [Symbol.hasInstance](instance: unknown): instance is SendPushRequest {
    return typeof instance === 'object' && instance !== null && (instance as any)[SEND_PUSH_BRAND] === true;
  }

  constructor(opts: SendPushRequestOptions) {
    Object.defineProperty(this, SEND_PUSH_BRAND, { value: true });
    this.message = {
      identifiers: opts.identifiers,
      transactional_message_id: opts.transactional_message_id,
      ...pickDefined(opts, PUSH_OPTIONAL_KEYS),
      // opts.device maps to custom_device on the wire
      ...(opts.device !== undefined && { custom_device: opts.device }),
    };

    if ('custom_payload' in opts) {
      this.message.custom_payload = opts.custom_payload;
    }
  }
}

export type SMSMessage = Partial<SendSMSRequestOptions>;

export type SendSMSRequestRequiredOptions = {
  identifiers: Identifiers;
  transactional_message_id: string | number;
};

export type SendSMSRequestOptionalOptions = Partial<{
  to: string;
  disable_message_retention: boolean;
  send_to_unsubscribed: boolean;
  queue_draft: boolean;
  message_data: Record<string, any>;
  send_at: number;
  language: string;
}>;

export type SendSMSRequestOptions = SendSMSRequestRequiredOptions & SendSMSRequestOptionalOptions & {};

const SMS_OPTIONAL_KEYS = [
  'to',
  'disable_message_retention',
  'send_to_unsubscribed',
  'queue_draft',
  'message_data',
  'send_at',
  'language',
] as const satisfies ReadonlyArray<keyof SendSMSRequestOptionalOptions>;

export class SendSMSRequest {
  message: SMSMessage;

  static [Symbol.hasInstance](instance: unknown): instance is SendSMSRequest {
    return typeof instance === 'object' && instance !== null && (instance as any)[SEND_SMS_BRAND] === true;
  }

  constructor(opts: SendSMSRequestOptions) {
    Object.defineProperty(this, SEND_SMS_BRAND, { value: true });
    this.message = {
      identifiers: opts.identifiers,
      transactional_message_id: opts.transactional_message_id,
      ...pickDefined(opts, SMS_OPTIONAL_KEYS),
    };
  }
}

export type InboxMessage = Partial<SendInboxMessageRequestOptions>;

export type SendInboxMessageRequestRequiredOptions = {
  identifiers: Identifiers;
  transactional_message_id: string | number;
};

export type SendInboxMessageRequestOptionalOptions = Partial<{
  disable_message_retention: boolean;
  queue_draft: boolean;
  message_data: Record<string, any>;
  send_at: number;
  language: string;
}>;

export type SendInboxMessageRequestOptions = SendInboxMessageRequestRequiredOptions &
  SendInboxMessageRequestOptionalOptions & {};

const INBOX_OPTIONAL_KEYS = [
  'disable_message_retention',
  'queue_draft',
  'message_data',
  'send_at',
  'language',
] as const satisfies ReadonlyArray<keyof SendInboxMessageRequestOptionalOptions>;

export class SendInboxMessageRequest {
  message: InboxMessage;

  static [Symbol.hasInstance](instance: unknown): instance is SendInboxMessageRequest {
    return typeof instance === 'object' && instance !== null && (instance as any)[SEND_INBOX_MESSAGE_BRAND] === true;
  }

  constructor(opts: SendInboxMessageRequestOptions) {
    Object.defineProperty(this, SEND_INBOX_MESSAGE_BRAND, { value: true });
    this.message = {
      identifiers: opts.identifiers,
      transactional_message_id: opts.transactional_message_id,
      ...pickDefined(opts, INBOX_OPTIONAL_KEYS),
    };
  }
}

export type InAppMessage = Partial<SendInAppRequestOptions>;

export type SendInAppRequestRequiredOptions = {
  identifiers: Identifiers;
  transactional_message_id: string | number;
};

export type SendInAppRequestOptionalOptions = Partial<{
  disable_message_retention: boolean;
  queue_draft: boolean;
  message_data: Record<string, any>;
  send_at: number;
  language: string;
}>;

export type SendInAppRequestOptions = SendInAppRequestRequiredOptions & SendInAppRequestOptionalOptions & {};

const IN_APP_OPTIONAL_KEYS = [
  'disable_message_retention',
  'queue_draft',
  'message_data',
  'send_at',
  'language',
] as const satisfies ReadonlyArray<keyof SendInAppRequestOptionalOptions>;

export class SendInAppRequest {
  message: InAppMessage;

  static [Symbol.hasInstance](instance: unknown): instance is SendInAppRequest {
    return typeof instance === 'object' && instance !== null && (instance as any)[SEND_IN_APP_BRAND] === true;
  }

  constructor(opts: SendInAppRequestOptions) {
    Object.defineProperty(this, SEND_IN_APP_BRAND, { value: true });
    this.message = {
      identifiers: opts.identifiers,
      transactional_message_id: opts.transactional_message_id,
      ...pickDefined(opts, IN_APP_OPTIONAL_KEYS),
    };
  }
}
