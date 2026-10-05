import type { RequestData, RequestDefaults, RetryOptions } from './request';
import Request from './request';
import { Region, RegionUS, RegionEU } from './regions';
import { TrackClient } from './track';
import { APIClient } from './api';
import {
  SendEmailRequest,
  SendPushRequest,
  SendSMSRequest,
  SendWhatsAppRequest,
  SendInboxMessageRequest,
  SendInAppRequest,
} from './api/requests';
import type {
  SendEmailRequestOptions,
  SendPushRequestOptions,
  SendSMSRequestOptions,
  SendWhatsAppRequestOptions,
  SendInboxMessageRequestOptions,
  SendInAppRequestOptions,
} from './api/requests';
import { CustomerIORequestError, KeyCapabilityError } from './utils';
import type { KeyCapability } from './utils';

/** Options for {@link CustomerIO}. */
export type CustomerIOOptions = RequestDefaults & {
  /** Your Customer.io secret key (`ak_…`), or a legacy App API key. */
  apiKey: string;
  /**
   * Data region. Optional for `ak_us_…` / `ak_eu_…` keys, which carry their
   * region. When set, it wins over the key. Legacy keys default to {@link RegionUS}.
   */
  region?: Region;
  /** Override the Track API base URL (e.g. a mock server). */
  trackUrl?: string;
  /** Override the App API base URL (e.g. a mock server). */
  apiUrl?: string;
  retry?: Partial<RetryOptions>;
};

type KeyInfo = { kind: 'ak' | 'wk'; region: Region } | null;

// Keys in the shared format look like `{ak|wk}_{us|eu}_{random}_{checksum}`.
// The server checks the checksum; the SDK only reads the prefix to pick a host.
const KEY_PREFIX = /^(ak|wk)_(us|eu)_/;

function parseKey(key: string): KeyInfo {
  const match = KEY_PREFIX.exec(key);
  if (!match) {
    return null;
  }

  return { kind: match[1] as 'ak' | 'wk', region: match[2] === 'eu' ? RegionEU : RegionUS };
}

/**
 * One client for tracking and transactional messages, authenticated with a
 * single secret key.
 *
 * Tracking methods (`identify`, `track`, `trackAnonymous`, `trackPageView`) go
 * to the Track API; `send*` methods go to the App API. Both send the key as a
 * Bearer token. For `ak_us_…` / `ak_eu_…` keys the region comes from the key.
 *
 * When a key can't do what a method asks, the method throws a
 * {@link KeyCapabilityError}: before the request when the key's type says so
 * (a public `wk_` key can't send transactional messages), otherwise when the
 * server answers 401 or 403.
 *
 * Other Track and App API methods are on {@link CustomerIO.trackClient} and
 * {@link CustomerIO.apiClient}.
 *
 * @example
 * ```ts
 * import { CustomerIO } from 'customerio-node';
 *
 * const cio = new CustomerIO({ apiKey: process.env.CIO_API_KEY });
 * await cio.identify('user_123', { email: 'a@example.com' });
 * await cio.track('user_123', { name: 'order_completed' });
 * await cio.sendEmail({
 *   to: 'a@example.com',
 *   identifiers: { id: 'user_123' },
 *   transactional_message_id: 5,
 * });
 * ```
 */
export class CustomerIO {
  /** Track API client, authenticated with the key as a Bearer token. */
  readonly trackClient: TrackClient;
  region: Region;
  private readonly keyKind: 'ak' | 'wk' | 'legacy';
  private readonly _apiClient: APIClient;

  /**
   * @throws If `apiKey` is empty, or `region` is provided and is not a {@link Region} instance.
   */
  constructor(options: CustomerIOOptions) {
    const { apiKey, region, trackUrl, apiUrl, ...requestDefaults } = options ?? ({} as CustomerIOOptions);

    if (!apiKey) {
      throw new Error('apiKey is required');
    }
    if (region && !(region instanceof Region)) {
      throw new Error('region must be one of Regions.US or Regions.EU');
    }

    const key = parseKey(apiKey);
    this.keyKind = key ? key.kind : 'legacy';
    this.region = region || key?.region || RegionUS;

    // TrackClient only speaks Basic auth, so swap in a Bearer transport.
    this.trackClient = new TrackClient('', '', { ...requestDefaults, region: this.region, url: trackUrl });
    this.trackClient.request = new Request(apiKey, requestDefaults);

    this._apiClient = new APIClient(apiKey, { ...requestDefaults, region: this.region, url: apiUrl });
  }

  /**
   * App API client, authenticated with the key.
   *
   * @throws {KeyCapabilityError} If the key is a public `wk_` key.
   */
  get apiClient(): APIClient {
    if (this.keyKind === 'wk') {
      throw new KeyCapabilityError(
        'transactional',
        "This key can't use the App API: public keys (wk_) are for tracking only. Use a secret key (ak_).",
      );
    }

    return this._apiClient;
  }

  /** Create or update a person. See {@link TrackClient.identify}. */
  identify(customerId: string | number, data?: RequestData) {
    return guard('track', () => this.trackClient.identify(customerId, data));
  }

  /** Track an event for a person. See {@link TrackClient.track}. */
  track(customerId: string | number, data?: RequestData) {
    return guard('track', () => this.trackClient.track(customerId, data));
  }

  /** Track an event for an anonymous visitor. See {@link TrackClient.trackAnonymous}. */
  trackAnonymous(anonymousId: string | number, data?: RequestData) {
    return guard('track', () => this.trackClient.trackAnonymous(anonymousId, data));
  }

  /** Track a page view for a person. See {@link TrackClient.trackPageView}. */
  trackPageView(customerId: string | number, path: string) {
    return guard('track', () => this.trackClient.trackPageView(customerId, path));
  }

  /** Send a transactional email. See {@link APIClient.sendEmail}. */
  sendEmail(req: SendEmailRequest | SendEmailRequestOptions) {
    return guard('transactional', () =>
      this.apiClient.sendEmail(req instanceof SendEmailRequest ? req : new SendEmailRequest(req)),
    );
  }

  /** Send a transactional push. See {@link APIClient.sendPush}. */
  sendPush(req: SendPushRequest | SendPushRequestOptions) {
    return guard('transactional', () =>
      this.apiClient.sendPush(req instanceof SendPushRequest ? req : new SendPushRequest(req)),
    );
  }

  /** Send a transactional SMS. See {@link APIClient.sendSMS}. */
  sendSMS(req: SendSMSRequest | SendSMSRequestOptions) {
    return guard('transactional', () =>
      this.apiClient.sendSMS(req instanceof SendSMSRequest ? req : new SendSMSRequest(req)),
    );
  }

  /** Send a transactional WhatsApp message. See {@link APIClient.sendWhatsApp}. */
  sendWhatsApp(req: SendWhatsAppRequest | SendWhatsAppRequestOptions) {
    return guard('transactional', () =>
      this.apiClient.sendWhatsApp(req instanceof SendWhatsAppRequest ? req : new SendWhatsAppRequest(req)),
    );
  }

  /** Send a transactional inbox message. See {@link APIClient.sendInboxMessage}. */
  sendInboxMessage(req: SendInboxMessageRequest | SendInboxMessageRequestOptions) {
    return guard('transactional', () =>
      this.apiClient.sendInboxMessage(req instanceof SendInboxMessageRequest ? req : new SendInboxMessageRequest(req)),
    );
  }

  /** Send a transactional in-app message. See {@link APIClient.sendInApp}. */
  sendInApp(req: SendInAppRequest | SendInAppRequestOptions) {
    return guard('transactional', () =>
      this.apiClient.sendInApp(req instanceof SendInAppRequest ? req : new SendInAppRequest(req)),
    );
  }
}

const CAPABILITY_ACTIONS: Record<KeyCapability, string> = {
  track: 'send tracking data',
  transactional: 'send transactional messages',
};

// Turns a 401/403 into a KeyCapabilityError so a key mismatch is never a bare
// auth failure. Synchronous throws (missing params, wk_ keys) pass through.
function guard(capability: KeyCapability, call: () => Promise<Record<string, any>>): Promise<Record<string, any>> {
  return call().catch((error: unknown) => {
    if (error instanceof CustomerIORequestError && (error.statusCode === 401 || error.statusCode === 403)) {
      throw new KeyCapabilityError(
        capability,
        `This key can't ${CAPABILITY_ACTIONS[capability]} (${error.statusCode}): ${error.message}`,
        error,
      );
    }
    throw error;
  });
}
