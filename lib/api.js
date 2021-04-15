const Request = require('./request');
const { Region, RegionUS } = require('./regions');
const { SendEmailRequest } = require('./api/requests');

const BROADCASTS_ALLOWED_RECIPIENT_FIELDS = {
  ids: ['ids', 'id_ignore_missing'],
  emails: ['emails', 'email_ignore_missing', 'email_add_duplicates'],
  per_user_data: ['per_user_data', 'id_ignore_missing', 'email_ignore_missing', 'email_add_duplicates'],
  data_file_url: ['data_file_url', 'id_ignore_missing', 'email_ignore_missing', 'email_add_duplicates'],
};

const filterRecipientsDataForField = (recipients, field) => {
  return BROADCASTS_ALLOWED_RECIPIENT_FIELDS[field].reduce((obj, field) => {
    if (!!recipients[field]) {
      obj[field] = recipients[field];
    }
    return obj;
  }, {});
};

class APIClient {
  constructor(appKey, defaults = {}) {
    if (defaults.region && !(defaults.region instanceof Region)) {
      throw new Error('region must be one of Regions.US or Regions.EU');
    }

    this.appKey = appKey;
    this.defaults = { ...defaults, region: defaults.region || RegionUS };
    this.request = new Request(this.appKey, this.defaults);

    this.apiRoot = this.defaults.url ? this.defaults.url : this.defaults.region.apiUrl;
  }

  sendEmail(req) {
    if (!(req instanceof SendEmailRequest)) {
      throw new Error('"request" must be an instance of SendEmailRequest');
    }

    return this.request.post(`${this.apiRoot}/send/email`, req.message);
  }

  triggerBroadcast(id, data, recipients) {
    let payload = {};
    let customRecipientField = Object.keys(BROADCASTS_ALLOWED_RECIPIENT_FIELDS).find(field => recipients[field]);

    if (customRecipientField) {
      payload = Object.assign({ data }, filterRecipientsDataForField(recipients, customRecipientField));
    } else {
      payload = {
        data,
        recipients,
      };
    }

    return this.request.post(`${this.apiRoot}/api/campaigns/${id}/triggers`, payload);
  }
}

module.exports = {
  APIClient,
  SendEmailRequest,
};
