const Request = require('./request');
const { trackRoot, apiRoot } = require('./common');

const BROADCASTS_ALLOWED_RECIPIENT_FIELDS = {
  ids: ['ids', 'id_ignore_missing'],
  emails: ['emails', 'email_ignore_missing', 'email_add_duplicates'],
  per_user_data: ['per_user_data'],
  data_file_url: ['data_file_url'],
};

const filterRecipientsDataForField = (recipients, field) => {
  return BROADCASTS_ALLOWED_RECIPIENT_FIELDS[field].reduce((obj, field) => {
    obj[field] = recipients[field];
    return obj;
  }, {});
};

module.exports = class CioTrackClient {
  constructor(siteid, apikey, defaults) {
    this.siteid = siteid;
    this.apikey = apikey;
    this.defaults = defaults;
    this.request = new Request({ siteid: this.siteid, apikey: this.apikey }, this.defaults);

    this._trackRoot = defaults && defaults.url ? defaults.url : trackRoot;
    this._apiRoot = defaults && defaults.apiUrl ? defaults.apiUrl : apiRoot;
  }

  identify(id, data = {}) {
    return this.request.put(`${this._trackRoot}/customers/${id}`, data);
  }

  destroy(id) {
    return this.request.destroy(`${this._trackRoot}/customers/${id}`);
  }

  suppress(id) {
    return this.request.post(`${this._trackRoot}/customers/${id}/suppress`);
  }

  track(id, data = {}) {
    return this.request.post(`${this._trackRoot}/customers/${id}/events`, data);
  }

  trackAnonymous(data = {}) {
    return this.request.post(`${this._trackRoot}/events`, data);
  }

  trackPageView(id, path) {
    return this.request.post(`${this._trackRoot}/customers/${id}/events`, {
      type: 'page',
      name: path,
    });
  }

  addDevice(id, device_id, platform, data = {}) {
    return this.request.put(`${this._trackRoot}/customers/${id}/devices`, {
      device: Object.assign({ id: device_id, platform }, data),
    });
  }

  deleteDevice(id, token) {
    return this.request.destroy(`${this._trackRoot}/customers/${id}/devices/${token}`);
  }

  triggerBroadcast(id, data, recipients) {
    let payload = {};
    let customRecipientField = Object.keys(BROADCASTS_ALLOWED_RECIPIENT_FIELDS).find((field) => recipients[field]);

    if (customRecipientField) {
      payload = Object.assign({ data }, filterRecipientsDataForField(recipients, customRecipientField));
    } else {
      payload = {
        data,
        recipients,
      };
    }

    return this.request.post(`${this._apiRoot}/api/campaigns/${id}/triggers`, payload);
  }

  addToSegment(segmentId, customerIds = []) {
    return this.request.post(`${this._trackRoot}/segments/${segmentId}/add_customers`, {
      ids: customerIds,
    });
  }

  removeFromSegment(segmentId, customerIds = []) {
    return this.request.post(`${this._trackRoot}/segments/${segmentId}/remove_customers`, {
      ids: customerIds,
    });
  }
};
