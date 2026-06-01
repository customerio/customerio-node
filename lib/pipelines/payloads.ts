/**
 * Type definitions for the Customer.io Pipelines API.
 *
 * Field names are camelCase end-to-end because that's what the Pipelines API
 * accepts on the wire (unlike the rest of this SDK, which is snake_case to
 * match the Track and App APIs). The shape mirrors the message envelope used
 * by `@customerio/cdp-analytics-node` so users moving between the two
 * libraries don't need to relearn the payload format.
 */

/**
 * Every Pipelines call must identify the person via at least one of `userId`
 * or `anonymousId`. Both may be present.
 */
export type PipelinesIdentifier =
  | { userId: string | number; anonymousId?: string }
  | { anonymousId: string; userId?: string | number };

/**
 * Server-side subset of the Segment/Pipelines `context` object.
 *
 * `app`, `device`, `network`, and `os` are intentionally omitted — those
 * fields are populated automatically by the Customer.io mobile SDKs and have
 * no meaningful value on a server-side call.
 */
export type PipelinesContext = Partial<{
  active: boolean;
  campaign: Partial<{
    name: string;
    source: string;
    medium: string;
    term: string;
    content: string;
  }>;
  ip: string;
  /**
   * Identifies the library producing the call. Auto-filled by `PipelinesClient`
   * with this package's name and version; per-call overrides win.
   */
  library: { name: string; version: string };
  locale: string;
  location: Partial<{
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    region: string;
    speed: number;
  }>;
  page: Partial<{
    hash: string;
    path: string;
    referrer: string;
    search: string;
    title: string;
    url: string;
  }>;
  referrer: Partial<{
    type: string;
    name: string;
    url: string;
    link: string;
  }>;
  timezone: string;
  groupId: string;
  traits: Record<string, unknown>;
  userAgent: string;
  userAgentData: Record<string, unknown>;
}>;

/**
 * Envelope fields shared by every Pipelines payload.
 *
 * `messageId` and `timestamp` are auto-filled by `PipelinesClient` when the
 * caller omits them; supplying them explicitly disables the auto-fill for
 * that field on that call.
 */
export type PipelinesCommon = Partial<{
  messageId: string;
  timestamp: string; // ISO 8601
  context: PipelinesContext;
  integrations: Record<string, boolean>;
}>;

export type IdentifyPayload = PipelinesIdentifier &
  PipelinesCommon & {
    traits?: Record<string, unknown>;
  };

export type TrackPayload = PipelinesIdentifier &
  PipelinesCommon & {
    event: string;
    properties?: Record<string, unknown>;
  };

export type PagePayload = PipelinesIdentifier &
  PipelinesCommon & {
    name?: string;
    category?: string;
    properties?: Record<string, unknown>;
  };

export type ScreenPayload = PipelinesIdentifier &
  PipelinesCommon & {
    name?: string;
    category?: string;
    properties?: Record<string, unknown>;
  };

export type GroupPayload = PipelinesIdentifier &
  PipelinesCommon & {
    groupId: string;
    traits?: Record<string, unknown>;
  };

export type AliasPayload = PipelinesCommon & {
  userId: string | number;
  previousId: string | number;
};

/**
 * A single entry in a `/batch` request. The `type` discriminator selects the
 * payload shape and tells the Pipelines API which endpoint the entry would
 * otherwise have been sent to.
 */
export type BatchItem =
  | ({ type: 'identify' } & IdentifyPayload)
  | ({ type: 'track' } & TrackPayload)
  | ({ type: 'page' } & PagePayload)
  | ({ type: 'screen' } & ScreenPayload)
  | ({ type: 'group' } & GroupPayload)
  | ({ type: 'alias' } & AliasPayload);
