import { pickDefined } from '../utils.js';

const SEND_EMAIL_BRAND = Symbol.for('customerio-node.SendEmailRequest');
const SEND_PUSH_BRAND = Symbol.for('customerio-node.SendPushRequest');
const SEND_SMS_BRAND = Symbol.for('customerio-node.SendSMSRequest');
const SEND_INBOX_MESSAGE_BRAND = Symbol.for('customerio-node.SendInboxMessageRequest');
const SEND_IN_APP_BRAND = Symbol.for('customerio-node.SendInAppRequest');

/** @typedef {{ id: string | number } | { email: string }} Identifiers */

/**
 * @typedef {object} SendEmailRequestRequiredOptions
 * @property {string} to
 * @property {Identifiers} identifiers
 */

/**
 * @typedef {object} SendEmailRequestOptionalOptions
 * @property {Record<string, any>} [message_data]
 * @property {Record<string, any>} [headers]
 * @property {string} [preheader]
 * @property {string} [reply_to]
 * @property {string} [bcc]
 * @property {string} [body]
 * @property {string} [body_plain]
 * @property {string} [body_amp]
 * @property {boolean} [fake_bcc]
 * @property {boolean} [disable_message_retention]
 * @property {boolean} [send_to_unsubscribed]
 * @property {boolean} [tracked]
 * @property {boolean} [queue_draft]
 * @property {number} [send_at]
 * @property {boolean} [disable_css_preprocessing]
 * @property {string} [language]
 */

/** @typedef {SendEmailRequestRequiredOptions & SendEmailRequestOptionalOptions & { transactional_message_id: string | number }} SendEmailRequestWithTemplate */
/** @typedef {SendEmailRequestRequiredOptions & SendEmailRequestOptionalOptions & { body: string; subject: string; from: string }} SendEmailRequestWithoutTemplate */
/** @typedef {SendEmailRequestWithTemplate | SendEmailRequestWithoutTemplate} SendEmailRequestOptions */
/** @typedef {Partial<SendEmailRequestWithTemplate & SendEmailRequestWithoutTemplate> & { attachments?: Record<string, string> }} EmailMessage */

/** @type {ReadonlyArray<keyof SendEmailRequestOptionalOptions>} */
const EMAIL_OPTIONAL_KEYS = /** @type {const} */ ([
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
]);

export class SendEmailRequest {
  /** @type {EmailMessage} */
  message;

  /**
   * @param {unknown} instance
   * @returns {instance is SendEmailRequest}
   */
  static [Symbol.hasInstance](instance) {
    return (
      typeof instance === 'object' && instance !== null && /** @type {any} */ (instance)[SEND_EMAIL_BRAND] === true
    );
  }

  /** @param {SendEmailRequestOptions} opts */
  constructor(opts) {
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

  /**
   * @param {string} name
   * @param {any} data
   * @param {{ encode?: boolean }} options
   */
  attach(name, data, { encode = true } = {}) {
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

/**
 * @typedef {object} SendPushCustomPayload
 * @property {Record<string, any>} ios
 * @property {Record<string, any>} android
 */

/**
 * @typedef {object} SendPushRequestRequiredOptions
 * @property {Identifiers} identifiers
 * @property {string | number} transactional_message_id
 */

/**
 * @typedef {object} SendPushRequestOptionalOptions
 * @property {string} [to]
 * @property {string} [title]
 * @property {string} [message]
 * @property {boolean} [disable_message_retention]
 * @property {boolean} [send_to_unsubscribed]
 * @property {boolean} [queue_draft]
 * @property {Record<string, any>} [message_data]
 * @property {number} [send_at]
 * @property {string} [language]
 * @property {string} [image_url]
 * @property {string} [link]
 * @property {string} [sound]
 * @property {Record<string, string>} [custom_data]
 * @property {Record<string, any>} [device]
 * @property {Record<string, any>} [custom_device]
 */

/** @typedef {SendPushRequestRequiredOptions & SendPushRequestOptionalOptions} SendPushRequestWithoutCustomPayload */
/** @typedef {SendPushRequestRequiredOptions & SendPushRequestOptionalOptions & { custom_payload: SendPushCustomPayload }} SendPushRequestWithCustomPayload */
/** @typedef {SendPushRequestWithoutCustomPayload | SendPushRequestWithCustomPayload} SendPushRequestOptions */
/** @typedef {Partial<Omit<SendPushRequestWithoutCustomPayload, 'device'> & Omit<SendPushRequestWithCustomPayload, 'device'>>} PushMessage */

/** @type {ReadonlyArray<keyof SendPushRequestOptionalOptions>} */
const PUSH_OPTIONAL_KEYS = /** @type {const} */ ([
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
]);

export class SendPushRequest {
  /** @type {PushMessage} */
  message;

  /**
   * @param {unknown} instance
   * @returns {instance is SendPushRequest}
   */
  static [Symbol.hasInstance](instance) {
    return typeof instance === 'object' && instance !== null && /** @type {any} */ (instance)[SEND_PUSH_BRAND] === true;
  }

  /** @param {SendPushRequestOptions} opts */
  constructor(opts) {
    Object.defineProperty(this, SEND_PUSH_BRAND, { value: true });
    this.message = {
      identifiers: opts.identifiers,
      transactional_message_id: opts.transactional_message_id,
      ...pickDefined(opts, PUSH_OPTIONAL_KEYS),
      ...(opts.device !== undefined && { custom_device: opts.device }),
    };

    if ('custom_payload' in opts) {
      this.message.custom_payload = opts.custom_payload;
    }
  }
}

/** @typedef {Partial<SendSMSRequestOptions>} SMSMessage */

/**
 * @typedef {object} SendSMSRequestRequiredOptions
 * @property {Identifiers} identifiers
 * @property {string | number} transactional_message_id
 */

/**
 * @typedef {object} SendSMSRequestOptionalOptions
 * @property {string} [to]
 * @property {boolean} [disable_message_retention]
 * @property {boolean} [send_to_unsubscribed]
 * @property {boolean} [queue_draft]
 * @property {Record<string, any>} [message_data]
 * @property {number} [send_at]
 * @property {string} [language]
 */

/** @typedef {SendSMSRequestRequiredOptions & SendSMSRequestOptionalOptions} SendSMSRequestOptions */

/** @type {ReadonlyArray<keyof SendSMSRequestOptionalOptions>} */
const SMS_OPTIONAL_KEYS = /** @type {const} */ ([
  'to',
  'disable_message_retention',
  'send_to_unsubscribed',
  'queue_draft',
  'message_data',
  'send_at',
  'language',
]);

export class SendSMSRequest {
  /** @type {SMSMessage} */
  message;

  /**
   * @param {unknown} instance
   * @returns {instance is SendSMSRequest}
   */
  static [Symbol.hasInstance](instance) {
    return typeof instance === 'object' && instance !== null && /** @type {any} */ (instance)[SEND_SMS_BRAND] === true;
  }

  /** @param {SendSMSRequestOptions} opts */
  constructor(opts) {
    Object.defineProperty(this, SEND_SMS_BRAND, { value: true });
    this.message = {
      identifiers: opts.identifiers,
      transactional_message_id: opts.transactional_message_id,
      ...pickDefined(opts, SMS_OPTIONAL_KEYS),
    };
  }
}

/** @typedef {Partial<SendInboxMessageRequestOptions>} InboxMessage */

/**
 * @typedef {object} SendInboxMessageRequestRequiredOptions
 * @property {Identifiers} identifiers
 * @property {string | number} transactional_message_id
 */

/**
 * @typedef {object} SendInboxMessageRequestOptionalOptions
 * @property {boolean} [disable_message_retention]
 * @property {boolean} [queue_draft]
 * @property {Record<string, any>} [message_data]
 * @property {number} [send_at]
 * @property {string} [language]
 */

/** @typedef {SendInboxMessageRequestRequiredOptions & SendInboxMessageRequestOptionalOptions} SendInboxMessageRequestOptions */

/** @type {ReadonlyArray<keyof SendInboxMessageRequestOptionalOptions>} */
const INBOX_OPTIONAL_KEYS = /** @type {const} */ ([
  'disable_message_retention',
  'queue_draft',
  'message_data',
  'send_at',
  'language',
]);

export class SendInboxMessageRequest {
  /** @type {InboxMessage} */
  message;

  /**
   * @param {unknown} instance
   * @returns {instance is SendInboxMessageRequest}
   */
  static [Symbol.hasInstance](instance) {
    return (
      typeof instance === 'object' &&
      instance !== null &&
      /** @type {any} */ (instance)[SEND_INBOX_MESSAGE_BRAND] === true
    );
  }

  /** @param {SendInboxMessageRequestOptions} opts */
  constructor(opts) {
    Object.defineProperty(this, SEND_INBOX_MESSAGE_BRAND, { value: true });
    this.message = {
      identifiers: opts.identifiers,
      transactional_message_id: opts.transactional_message_id,
      ...pickDefined(opts, INBOX_OPTIONAL_KEYS),
    };
  }
}

/** @typedef {Partial<SendInAppRequestOptions>} InAppMessage */

/**
 * @typedef {object} SendInAppRequestRequiredOptions
 * @property {Identifiers} identifiers
 * @property {string | number} transactional_message_id
 */

/**
 * @typedef {object} SendInAppRequestOptionalOptions
 * @property {boolean} [disable_message_retention]
 * @property {boolean} [queue_draft]
 * @property {Record<string, any>} [message_data]
 * @property {number} [send_at]
 * @property {string} [language]
 */

/** @typedef {SendInAppRequestRequiredOptions & SendInAppRequestOptionalOptions} SendInAppRequestOptions */

/** @type {ReadonlyArray<keyof SendInAppRequestOptionalOptions>} */
const IN_APP_OPTIONAL_KEYS = /** @type {const} */ ([
  'disable_message_retention',
  'queue_draft',
  'message_data',
  'send_at',
  'language',
]);

export class SendInAppRequest {
  /** @type {InAppMessage} */
  message;

  /**
   * @param {unknown} instance
   * @returns {instance is SendInAppRequest}
   */
  static [Symbol.hasInstance](instance) {
    return (
      typeof instance === 'object' && instance !== null && /** @type {any} */ (instance)[SEND_IN_APP_BRAND] === true
    );
  }

  /** @param {SendInAppRequestOptions} opts */
  constructor(opts) {
    Object.defineProperty(this, SEND_IN_APP_BRAND, { value: true });
    this.message = {
      identifiers: opts.identifiers,
      transactional_message_id: opts.transactional_message_id,
      ...pickDefined(opts, IN_APP_OPTIONAL_KEYS),
    };
  }
}
