import { randomUUID } from 'crypto';
import CIORequest from './request.js';
import { Region, RegionUS } from './regions.js';
import { isEmpty, MissingParamError } from './utils.js';
import { version } from './version.js';

/** @typedef {import('./pipelines/payloads.js').AliasPayload} AliasPayload */
/** @typedef {import('./pipelines/payloads.js').BatchItem} BatchItem */
/** @typedef {import('./pipelines/payloads.js').GroupPayload} GroupPayload */
/** @typedef {import('./pipelines/payloads.js').IdentifyPayload} IdentifyPayload */
/** @typedef {import('./pipelines/payloads.js').PagePayload} PagePayload */
/** @typedef {import('./pipelines/payloads.js').PipelinesCommon} PipelinesCommon */
/** @typedef {import('./pipelines/payloads.js').PipelinesContext} PipelinesContext */
/** @typedef {import('./pipelines/payloads.js').ScreenPayload} ScreenPayload */
/** @typedef {import('./pipelines/payloads.js').TrackPayload} TrackPayload */

/**
 * @typedef {import('https').RequestOptions & {
 *   region: Region;
 *   url?: string;
 *   strictMode?: boolean;
 *   defaultContext?: PipelinesContext;
 * }} PipelinesDefaults
 */

export class PipelinesClient {
  /** @type {string} */
  writeKey;
  /** @type {PipelinesDefaults} */
  defaults;
  /** @type {CIORequest} */
  request;
  /** @type {string} */
  pipelinesRoot;
  /** @type {PipelinesContext} */
  #autoContext;

  /**
   * @param {string} writeKey
   * @param {Partial<PipelinesDefaults>} [defaults]
   */
  constructor(writeKey, defaults = {}) {
    if (isEmpty(writeKey)) {
      throw new MissingParamError('writeKey');
    }
    if (defaults.region && !(defaults.region instanceof Region)) {
      throw new Error('region must be one of Regions.US or Regions.EU');
    }

    this.writeKey = writeKey;
    const headers = defaults.strictMode ? { ...(defaults.headers ?? {}), 'X-Strict-Mode': '1' } : defaults.headers;
    this.defaults = /** @type {PipelinesDefaults} */ ({ ...defaults, headers, region: defaults.region || RegionUS });

    this.request = new CIORequest({ siteid: writeKey, apikey: '' }, this.defaults);

    this.pipelinesRoot = this.defaults.url ? this.defaults.url : this.defaults.region.pipelinesUrl;

    this.#autoContext = {
      ...(this.defaults.defaultContext ?? {}),
      library: { name: 'customerio-node', version },
    };
  }

  /** @param {IdentifyPayload} payload */
  identify(payload) {
    if (isEmpty(payload?.userId) && isEmpty(payload?.anonymousId)) {
      throw new MissingParamError('userId or anonymousId');
    }
    return this.request.post(`${this.pipelinesRoot}/identify`, this.#envelope(payload));
  }

  /** @param {TrackPayload} payload */
  track(payload) {
    if (isEmpty(payload?.userId) && isEmpty(payload?.anonymousId)) {
      throw new MissingParamError('userId or anonymousId');
    }
    if (isEmpty(payload?.event)) {
      throw new MissingParamError('event');
    }
    return this.request.post(`${this.pipelinesRoot}/track`, this.#envelope(payload));
  }

  /** @param {PagePayload} payload */
  page(payload) {
    if (isEmpty(payload?.userId) && isEmpty(payload?.anonymousId)) {
      throw new MissingParamError('userId or anonymousId');
    }
    return this.request.post(`${this.pipelinesRoot}/page`, this.#envelope(payload));
  }

  /** @param {ScreenPayload} payload */
  screen(payload) {
    if (isEmpty(payload?.userId) && isEmpty(payload?.anonymousId)) {
      throw new MissingParamError('userId or anonymousId');
    }
    return this.request.post(`${this.pipelinesRoot}/screen`, this.#envelope(payload));
  }

  /** @param {GroupPayload} payload */
  group(payload) {
    if (isEmpty(payload?.userId) && isEmpty(payload?.anonymousId)) {
      throw new MissingParamError('userId or anonymousId');
    }
    if (isEmpty(payload?.groupId)) {
      throw new MissingParamError('groupId');
    }
    return this.request.post(`${this.pipelinesRoot}/group`, this.#envelope(payload));
  }

  /** @param {AliasPayload} payload */
  alias(payload) {
    if (isEmpty(payload?.userId)) {
      throw new MissingParamError('userId');
    }
    if (isEmpty(payload?.previousId)) {
      throw new MissingParamError('previousId');
    }
    return this.request.post(`${this.pipelinesRoot}/alias`, this.#envelope(payload));
  }

  /** @param {BatchItem[]} items */
  batch(items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new MissingParamError('items');
    }
    const batch = items.map((item) => ({ ...this.#envelope(item), type: item.type }));
    return this.request.post(`${this.pipelinesRoot}/batch`, { batch });
  }

  /**
   * @template {PipelinesCommon} T
   * @param {T} payload
   * @returns {T}
   */
  #envelope(payload) {
    /** @type {PipelinesContext} */
    const merged = {
      ...this.#autoContext,
      ...(payload.context ?? {}),
    };
    merged.library = payload.context?.library ?? this.#autoContext.library;

    return {
      ...payload,
      messageId: payload.messageId ?? randomUUID(),
      timestamp: payload.timestamp ?? new Date().toISOString(),
      context: merged,
    };
  }
}
