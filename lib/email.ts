import Request, { BearerAuth } from './request';
import { Region, RegionUS } from './regions';
import { SendEmailInput, validateSendEmailInput } from './email-input';

// The server-side gate keys off this exact substring in the User-Agent header.
// Keep in sync with serve.SDKPreviewUserAgentMarker in customerio/edge.
export const SDK_PREVIEW_USER_AGENT_MARKER = 'CioEmailSDK-Preview';

export type EmailClientOptions = {
  apiKey: BearerAuth;
  region?: Region;
  url?: string;
};

export type SendEmailResponse = {
  delivery_id: string;
};

export class EmailClient {
  apiKey: BearerAuth;
  region: Region;
  apiRoot: string;
  request: Request;

  constructor(opts: EmailClientOptions) {
    if (!opts.apiKey) {
      throw new Error('EmailClient: apiKey is required');
    }
    if (opts.region && !(opts.region instanceof Region)) {
      throw new Error('region must be one of Regions.US or Regions.EU');
    }

    this.apiKey = opts.apiKey;
    this.region = opts.region || RegionUS;
    this.apiRoot = opts.url ? opts.url : this.region.apiUrl;
    this.request = new Request(this.apiKey, undefined, SDK_PREVIEW_USER_AGENT_MARKER);
  }

  send(input: SendEmailInput): Promise<SendEmailResponse> {
    validateSendEmailInput(input);
    return this.request.post(`${this.apiRoot}/send/email`, input) as Promise<SendEmailResponse>;
  }
}
