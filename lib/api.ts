import Request, { BearerAuth, RequestData, RequestDefaults } from './request';
import { Region, RegionUS } from './regions';
import { SendEmailRequest } from './api/requests';

type APIDefaults = RequestDefaults & { region: Region; url?: string };

type Recipients = Record<string, unknown>;

type BroadcastsAllowedRecipientFieldsKeys = keyof typeof BROADCASTS_ALLOWED_RECIPIENT_FIELDS;

const BROADCASTS_ALLOWED_RECIPIENT_FIELDS = {
  ids: ['ids', 'id_ignore_missing'],
  emails: ['emails', 'email_ignore_missing', 'email_add_duplicates'],
  per_user_data: ['per_user_data', 'id_ignore_missing', 'email_ignore_missing', 'email_add_duplicates'],
  data_file_url: ['data_file_url', 'id_ignore_missing', 'email_ignore_missing', 'email_add_duplicates'],
};

const filterRecipientsDataForField = (recipients: Recipients, field: BroadcastsAllowedRecipientFieldsKeys) => {
  return BROADCASTS_ALLOWED_RECIPIENT_FIELDS[field].reduce<Record<string, unknown>>((obj, field) => {
    if (!!recipients[field]) {
      obj[field] = recipients[field];
    }
    return obj;
  }, {});
};

export class APIClient {
  appKey: BearerAuth;
  defaults: APIDefaults;
  request: Request;
  apiRoot: string;

  constructor(appKey: BearerAuth, defaults: Partial<APIDefaults> = {}) {
    if (defaults.region && !(defaults.region instanceof Region)) {
      throw new Error('region must be one of Regions.US or Regions.EU');
    }

    this.appKey = appKey;
    this.defaults = { ...defaults, region: defaults.region || RegionUS };
    this.request = new Request(this.appKey, this.defaults);

    this.apiRoot = this.defaults.url ? this.defaults.url : this.defaults.region.apiUrl;
  }

  sendEmail(req: SendEmailRequest) {
    if (!(req instanceof SendEmailRequest)) {
      throw new Error('"request" must be an instance of SendEmailRequest');
    }

    return this.request.post(`${this.apiRoot}/send/email`, req.message);
  }

  triggerBroadcast(id: string | number, data: RequestData, recipients: Recipients) {
    let payload = {};
    let customRecipientField = (Object.keys(
      BROADCASTS_ALLOWED_RECIPIENT_FIELDS,
    ) as BroadcastsAllowedRecipientFieldsKeys[]).find((field) => recipients[field]);

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

export { SendEmailRequest } from './api/requests';
