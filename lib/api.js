import CIORequest from './request.js';
import { Region, RegionUS } from './regions.js';
import {
  SendEmailRequest,
  SendPushRequest,
  SendSMSRequest,
  SendInboxMessageRequest,
  SendInAppRequest,
} from './api/requests.js';
import { isEmpty, isIdentifierType, MissingParamError } from './utils.js';
import { IdentifierType } from './types.js';

/** @typedef {import('./request.js').RequestData} RequestData */
/** @typedef {import('./request.js').BearerAuth} BearerAuth */
/** @typedef {import('./types.js').Filter} Filter */
/** @typedef {import('https').RequestOptions & { region: Region; url?: string }} APIDefaults */
/** @typedef {Record<string, unknown>} Recipients */
/** @typedef {keyof typeof BROADCASTS_ALLOWED_RECIPIENT_FIELDS} BroadcastsAllowedRecipientFieldsKeys */

/** @enum {string} */
export const DeliveryExportMetric = /** @type {const} */ ({
  Created: 'created',
  Attempted: 'attempted',
  Sent: 'sent',
  Delivered: 'delivered',
  Opened: 'opened',
  Clicked: 'clicked',
  Converted: 'converted',
  Bounced: 'bounced',
  Spammed: 'spammed',
  Unsubscribed: 'unsubscribed',
  Dropped: 'dropped',
  Failed: 'failed',
  Undeliverable: 'undeliverable',
});
Object.freeze(DeliveryExportMetric);

/**
 * @typedef {object} DeliveryExportRequestOptions
 * @property {number} [start]
 * @property {number} [end]
 * @property {string[]} [attributes]
 * @property {DeliveryExportMetric} [metric]
 * @property {boolean} [drafts]
 */

const BROADCASTS_ALLOWED_RECIPIENT_FIELDS = {
  ids: ['ids', 'id_ignore_missing'],
  emails: ['emails', 'email_ignore_missing', 'email_add_duplicates'],
  per_user_data: ['per_user_data', 'id_ignore_missing', 'email_ignore_missing', 'email_add_duplicates'],
  data_file_url: ['data_file_url', 'id_ignore_missing', 'email_ignore_missing', 'email_add_duplicates'],
};

/**
 * @param {Recipients} recipients
 * @param {BroadcastsAllowedRecipientFieldsKeys} field
 * @returns {Record<string, unknown>}
 */
const filterRecipientsDataForField = (recipients, field) => {
  return BROADCASTS_ALLOWED_RECIPIENT_FIELDS[field].reduce(
    /**
     * @param {Record<string, unknown>} obj
     * @param {string} field
     */
    (obj, field) => {
      if (!!recipients[field]) {
        obj[field] = recipients[field];
      }
      return obj;
    },
    {},
  );
};

export class APIClient {
  /** @type {BearerAuth} */
  appKey;
  /** @type {APIDefaults} */
  defaults;
  /** @type {CIORequest} */
  request;
  /** @type {string} */
  apiRoot;

  /**
   * @param {BearerAuth} appKey
   * @param {Partial<APIDefaults>} [defaults]
   */
  constructor(appKey, defaults = {}) {
    if (defaults.region && !(defaults.region instanceof Region)) {
      throw new Error('region must be one of Regions.US or Regions.EU');
    }

    this.appKey = appKey;
    this.defaults = /** @type {APIDefaults} */ ({ ...defaults, region: defaults.region || RegionUS });
    this.request = new CIORequest(this.appKey, this.defaults);

    this.apiRoot = this.defaults.url ? this.defaults.url : this.defaults.region.apiUrl;
  }

  /** @param {SendEmailRequest} req */
  sendEmail(req) {
    if (!(req instanceof SendEmailRequest)) {
      throw new Error('"request" must be an instance of SendEmailRequest');
    }

    return this.request.post(`${this.apiRoot}/send/email`, req.message);
  }

  /** @param {SendPushRequest} req */
  sendPush(req) {
    if (!(req instanceof SendPushRequest)) {
      throw new Error('"request" must be an instance of SendPushRequest');
    }

    return this.request.post(`${this.apiRoot}/send/push`, req.message);
  }

  /** @param {SendSMSRequest} req */
  sendSMS(req) {
    if (!(req instanceof SendSMSRequest)) {
      throw new Error('"request" must be an instance of SendSMSRequest');
    }

    return this.request.post(`${this.apiRoot}/send/sms`, req.message);
  }

  /** @param {SendInboxMessageRequest} req */
  sendInboxMessage(req) {
    if (!(req instanceof SendInboxMessageRequest)) {
      throw new Error('"request" must be an instance of SendInboxMessageRequest');
    }

    return this.request.post(`${this.apiRoot}/send/inbox_message`, req.message);
  }

  /** @param {SendInAppRequest} req */
  sendInApp(req) {
    if (!(req instanceof SendInAppRequest)) {
      throw new Error('"request" must be an instance of SendInAppRequest');
    }

    return this.request.post(`${this.apiRoot}/send/in_app`, req.message);
  }

  /** @param {string} email */
  getCustomersByEmail(email) {
    if (typeof email !== 'string' || isEmpty(email)) {
      throw new Error('"email" must be a string');
    }

    return this.request.get(`${this.apiRoot}/customers?email=${encodeURIComponent(email)}`);
  }

  /**
   * @param {string | number} broadcastId
   * @param {RequestData} data
   * @param {Recipients} recipients
   */
  triggerBroadcast(broadcastId, data, recipients) {
    let payload = {};
    let customRecipientField = /** @type {BroadcastsAllowedRecipientFieldsKeys | undefined} */ (
      /** @type {BroadcastsAllowedRecipientFieldsKeys[]} */ (Object.keys(BROADCASTS_ALLOWED_RECIPIENT_FIELDS)).find(
        (field) => recipients[field],
      )
    );

    if (customRecipientField) {
      payload = Object.assign({ data }, filterRecipientsDataForField(recipients, customRecipientField));
    } else {
      payload = {
        data,
        recipients,
      };
    }

    return this.request.post(`${this.apiRoot}/campaigns/${encodeURIComponent(broadcastId)}/triggers`, payload);
  }

  listExports() {
    return this.request.get(`${this.apiRoot}/exports`);
  }

  /** @param {string | number} id */
  getExport(id) {
    if (isEmpty(id)) {
      throw new MissingParamError('id');
    }

    return this.request.get(`${this.apiRoot}/exports/${encodeURIComponent(id)}`);
  }

  /** @param {string | number} id */
  downloadExport(id) {
    if (isEmpty(id)) {
      throw new MissingParamError('id');
    }

    return this.request.get(`${this.apiRoot}/exports/${encodeURIComponent(id)}/download`);
  }

  /** @param {Filter} filters */
  createCustomersExport(filters) {
    if (filters == null) {
      throw new MissingParamError('filters');
    }

    return this.request.post(`${this.apiRoot}/exports/customers`, { filters });
  }

  /**
   * @param {number} newsletterId
   * @param {DeliveryExportRequestOptions} [options]
   */
  createDeliveriesExport(newsletterId, options) {
    if (isEmpty(newsletterId)) {
      throw new MissingParamError('newsletterId');
    }

    return this.request.post(`${this.apiRoot}/exports/deliveries`, { newsletter_id: newsletterId, ...options });
  }

  /**
   * @param {string | number} id
   * @param {IdentifierType} [idType]
   */
  getAttributes(id, idType = IdentifierType.Id) {
    if (isEmpty(id)) {
      throw new MissingParamError('customerId');
    }

    if (!isIdentifierType(idType)) {
      throw new Error('idType must be one of "id", "cio_id", or "email"');
    }

    return this.request.get(`${this.apiRoot}/customers/${encodeURIComponent(id)}/attributes?id_type=${idType}`);
  }
}

export {
  SendEmailRequest,
  SendPushRequest,
  SendSMSRequest,
  SendInboxMessageRequest,
  SendInAppRequest,
} from './api/requests.js';
