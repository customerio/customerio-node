/**
 * @typedef {{ userId: string | number; anonymousId?: string } | { anonymousId: string; userId?: string | number }} PipelinesIdentifier
 */

/**
 * @typedef {Partial<{
 *   active: boolean;
 *   campaign: Partial<{ name: string; source: string; medium: string; term: string; content: string }>;
 *   ip: string;
 *   library: { name: string; version: string };
 *   locale: string;
 *   location: Partial<{ city: string; country: string; latitude: number; longitude: number; region: string; speed: number }>;
 *   page: Partial<{ hash: string; path: string; referrer: string; search: string; title: string; url: string }>;
 *   referrer: Partial<{ type: string; name: string; url: string; link: string }>;
 *   timezone: string;
 *   groupId: string;
 *   traits: Record<string, unknown>;
 *   userAgent: string;
 *   userAgentData: Record<string, unknown>;
 * }>} PipelinesContext
 */

/**
 * @typedef {Partial<{
 *   messageId: string;
 *   timestamp: string;
 *   context: PipelinesContext;
 *   integrations: Record<string, boolean>;
 * }>} PipelinesCommon
 */

/** @typedef {PipelinesIdentifier & PipelinesCommon & { traits?: Record<string, unknown> }} IdentifyPayload */

/** @typedef {PipelinesIdentifier & PipelinesCommon & { event: string; properties?: Record<string, unknown> }} TrackPayload */

/** @typedef {PipelinesIdentifier & PipelinesCommon & { name?: string; category?: string; properties?: Record<string, unknown> }} PagePayload */

/** @typedef {PipelinesIdentifier & PipelinesCommon & { name?: string; category?: string; properties?: Record<string, unknown> }} ScreenPayload */

/** @typedef {PipelinesIdentifier & PipelinesCommon & { groupId: string; traits?: Record<string, unknown> }} GroupPayload */

/** @typedef {PipelinesCommon & { userId: string | number; previousId: string | number }} AliasPayload */

/**
 * @typedef {(
 *   | ({ type: 'identify' } & IdentifyPayload)
 *   | ({ type: 'track' } & TrackPayload)
 *   | ({ type: 'page' } & PagePayload)
 *   | ({ type: 'screen' } & ScreenPayload)
 *   | ({ type: 'group' } & GroupPayload)
 *   | ({ type: 'alias' } & AliasPayload)
 * )} BatchItem
 */
