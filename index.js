export { TrackClient } from './lib/track.js';
export {
  APIClient,
  DeliveryExportMetric,
  SendEmailRequest,
  SendPushRequest,
  SendSMSRequest,
  SendInboxMessageRequest,
  SendInAppRequest,
} from './lib/api.js';
export { PipelinesClient } from './lib/pipelines.js';
export { Region, RegionUS, RegionEU } from './lib/regions.js';
export { IdentifierType, FilterOperator } from './lib/types.js';
export { CustomerIORequestError } from './lib/utils.js';

/** @typedef {import('./lib/types.js').SegmentFilter} SegmentFilter */
/** @typedef {import('./lib/types.js').AttributeFilter} AttributeFilter */
/** @typedef {import('./lib/types.js').NotFilter} NotFilter */
/** @typedef {import('./lib/types.js').FilterObject} FilterObject */
/** @typedef {import('./lib/types.js').AndFilter} AndFilter */
/** @typedef {import('./lib/types.js').OrFilter} OrFilter */
/** @typedef {import('./lib/types.js').Filter} Filter */
/** @typedef {import('./lib/request.js').BasicAuth} BasicAuth */
/** @typedef {import('./lib/request.js').BearerAuth} BearerAuth */
/** @typedef {import('./lib/request.js').RequestAuth} RequestAuth */
/** @typedef {import('./lib/request.js').RequestData} RequestData */
/** @typedef {import('./lib/request.js').RequestHandlerOptions} RequestHandlerOptions */
/** @typedef {import('./lib/request.js').PushRequestData} PushRequestData */
/** @typedef {import('./lib/track.js').BatchOperation} BatchOperation */
/** @typedef {import('./lib/api.js').DeliveryExportRequestOptions} DeliveryExportRequestOptions */
/** @typedef {import('./lib/api/requests.js').Identifiers} Identifiers */
/** @typedef {import('./lib/api/requests.js').SendEmailRequestOptions} SendEmailRequestOptions */
/** @typedef {import('./lib/api/requests.js').SendPushRequestOptions} SendPushRequestOptions */
/** @typedef {import('./lib/api/requests.js').SendSMSRequestOptions} SendSMSRequestOptions */
/** @typedef {import('./lib/api/requests.js').SendInboxMessageRequestOptions} SendInboxMessageRequestOptions */
/** @typedef {import('./lib/api/requests.js').SendInAppRequestOptions} SendInAppRequestOptions */
/** @typedef {import('./lib/pipelines.js').PipelinesDefaults} PipelinesDefaults */
/** @typedef {import('./lib/pipelines/payloads.js').AliasPayload} AliasPayload */
/** @typedef {import('./lib/pipelines/payloads.js').BatchItem} BatchItem */
/** @typedef {import('./lib/pipelines/payloads.js').GroupPayload} GroupPayload */
/** @typedef {import('./lib/pipelines/payloads.js').IdentifyPayload} IdentifyPayload */
/** @typedef {import('./lib/pipelines/payloads.js').PagePayload} PagePayload */
/** @typedef {import('./lib/pipelines/payloads.js').PipelinesCommon} PipelinesCommon */
/** @typedef {import('./lib/pipelines/payloads.js').PipelinesContext} PipelinesContext */
/** @typedef {import('./lib/pipelines/payloads.js').ScreenPayload} ScreenPayload */
/** @typedef {import('./lib/pipelines/payloads.js').TrackPayload} TrackPayload */
