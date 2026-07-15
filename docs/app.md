# App API (`APIClient`)

Method reference for the App API client. See the [README](../README.md) for installation and cross-cutting behavior (regions, retries, and promise handling).

### Transactional API

To use the Customer.io [Transactional API](https://customer.io/docs/transactional-api), import our API client and initialize it with an [app key](https://customer.io/docs/managing-credentials#app-api-keys) and create a request object of your message type.

#### Email

Create a new `SendEmailRequest` object containing:

- `transactional_message_id`: the ID of the transactional message you want to send, or the `body`, `from`, and `subject` of a new message.
- `to`: the email address of your recipients
- an `identifiers` object containing the email and/or `id` of your recipient. If the person you reference by email or ID does not exist, Customer.io creates them.
- a `message_data` object containing properties that you want reference in your message using Liquid.
- You can also send attachments with your message with `attach`, but you need to read the file to a buffer (with `fs.readFileSync`, for example); you cannot attach raw, base64-encoded data directly from a variable.

Use `sendEmail` referencing your request to send a transactional message. [Learn more about transactional messages and `SendEmailRequest` properties](https://customer.io/docs/transactional-api).

```javascript
const fs = require("fs");
const { APIClient, SendEmailRequest, RegionUS, RegionEU } = require("customerio-node");
const api = new APIClient("app-key", { region: RegionUS });

const request = new SendEmailRequest({
  to: "person@example.com",
  transactional_message_id: "3",
  message_data: {
    name: "Person",
    items: {
      name: "shoes",
      price: "59.99",
    },
    products: [],
  },
  identifiers: {
    email: "person@example.com",
  },
});

// (optional) attach a file to your message.
// Note that you need to read the file to a buffer;
// you can't simply attach raw, base64-encoded data.
request.attach("receipt.pdf", fs.readFileSync("receipt.pdf"));

api
  .sendEmail(request)
  .then((res) => console.log(res))
  .catch((err) => console.log(err.statusCode, err.message));
```

#### Push

Create a new `SendPushRequest` object containing:

- `transactional_message_id`: the ID or trigger name of the transactional message you want to send.
- an `identifiers` object containing the `id` or `email` of your recipient. If the profile does not exist, Customer.io will create it.

Use `sendPush` referencing your request to send a transactional message. [Learn more about transactional messages and `sendPushRequest` properties](https://customer.io/docs/transactional-api).

```javascript
const { APIClient, SendPushRequest, RegionUS, RegionEU } = require("customerio-node");
const api = new APIClient("app-key", { region: RegionUS });

const request = new SendPushRequest({
  transactional_message_id: "3",
  message_data: {
    name: "Person",
    items: {
      name: "shoes",
      price: "59.99",
    },
    products: [],
  },
  identifiers: {
    id: "2",
  },
});

api
  .sendPush(request)
  .then((res) => console.log(res))
  .catch((err) => console.log(err.statusCode, err.message));
```

#### WhatsApp

Create a new `SendWhatsAppRequest` object containing:

- `transactional_message_id`: the ID or trigger name of the transactional message you want to send.
- an `identifiers` object containing the `id` or `email` of your recipient. If the profile does not exist, Customer.io will create it.
- `to` and `from`: E.164-formatted phone numbers. Both are optional only when the referenced `transactional_message_id` already defines them.

Use `sendWhatsApp` referencing your request to send a transactional message. [Learn more about transactional messages](https://customer.io/docs/transactional-api).

```javascript
const { APIClient, SendWhatsAppRequest, RegionUS, RegionEU } = require("customerio-node");
const api = new APIClient("app-key", { region: RegionUS });

const request = new SendWhatsAppRequest({
  to: "+15558675309",
  from: "+15551234567",
  transactional_message_id: "3",
  message_data: {
    name: "Person",
  },
  identifiers: {
    id: "2",
  },
});

api
  .sendWhatsApp(request)
  .then((res) => console.log(res))
  .catch((err) => console.log(err.statusCode, err.message));
```

### api.triggerBroadcast(campaign_id, data, recipients)

Trigger an email broadcast using the broadcast ID. You can also optionally pass along custom data that will be merged with the liquid template, and additional conditions to filter recipients.

```javascript
api.triggerBroadcast(1, { name: "foo" }, { segment: { id: 7 } });
```

You can also use emails or ids to select recipients, and pass optional API parameters such as `email_ignore_missing`.

```javascript
api.triggerBroadcast(1, { name: "foo" }, { emails: ["example@emails.com"], email_ignore_missing: true });
```

[You can learn more about the available recipient fields here](https://customer.io/docs/api/#operation/triggerBroadcast).

Both `data` and `recipients` are optional. Omitting `recipients` sends the broadcast to its configured recipients. Note that the parameters are positional: to pass `recipients` without `data`, pass `undefined` for `data` — passing the recipient selector as the second argument would send it as liquid data instead.

```javascript
api.triggerBroadcast(1); // broadcast's configured recipients
api.triggerBroadcast(1, undefined, { emails: ["example@emails.com"], email_ignore_missing: true });
```

#### Options

- **id**: String or number (required)
- **data**: Object (optional)
- **recipients**: Object (optional)

### api.getCustomersByEmail(email)

Returns customer object with given email.

```javascript
api.getCustomersByEmail("test@test.com");
```

[You can learn more about the available recipient fields here](https://customer.io/docs/api/#operation/getPeopleEmail).

#### Options

- **email**: String (required)

### api.getAttributes(id, id_type)

Returns a list of attributes for a customer profile.

```javascript
api.getAttributes("1", "id");
```

OR

```javascript
const { IdentifierType } = require("customerio-node");

api.getAttributes("1", IdentifierType.ID);
```

[You can learn more about the available recipient fields here](https://customer.io/docs/api/#operation/getPersonAttributes).

#### Options

- **id**: Customer identifier, String or number (required)
- **id_type**: One of the ID types - "id" / "email" / "cio_id" (default is "id")

### api.getCustomerActivities(customerId, options)

Look up a person's activities (events, attribute changes, message activity, etc.).

```javascript
api.getCustomerActivities("1", { type: "event", name: "purchase", limit: 50 });
```

#### Options

- **customerId**: Customer identifier, String or number (required)
- **options**: Object (optional)
  - _idType_: One of "id" / "email" / "cio_id" (defaults to "id")
  - _start_: Pagination cursor from a previous page's `next`
  - _limit_: Maximum number of results
  - _type_: Filter to a single [activity type](https://docs.customer.io/api/app/#operation/listCustomerActivities)
  - _name_: Filter to activities with this name

### api.getCustomerMessages(customerId, options)

Look up messages sent to a person.

```javascript
api.getCustomerMessages("1", { start_ts: 1719792000, end_ts: 1719878400 });
```

#### Options

- **customerId**: Customer identifier, String or number (required)
- **options**: Object (optional) — `idType`, `start`, `limit`, and `start_ts` / `end_ts` Unix timestamp bounds

### api.getCustomerRelationships(customerId, options)

Look up a person's relationships to objects.

```javascript
api.getCustomerRelationships("1", { limit: 20 });
```

#### Options

- **customerId**: Customer identifier, String or number (required)
- **options**: Object (optional) — `start`, `limit`

### api.getCustomerSegments(customerId, idType)

Look up the segments a person belongs to.

```javascript
api.getCustomerSegments("1", IdentifierType.Id);
```

#### Options

- **customerId**: Customer identifier, String or number (required)
- **idType**: One of "id" / "email" / "cio_id" (default is "id")

### api.getCustomerSubscriptionPreferences(customerId, options)

Look up a person's subscription (topic) preferences.

```javascript
api.getCustomerSubscriptionPreferences("1", { language: "es-ES" });
```

#### Options

- **customerId**: Customer identifier, String or number (required)
- **options**: Object (optional) — `idType`, and `language` (an IETF language tag used to localize topic names)

### api.searchCustomers(filter, options)

Search for people matching a filter expression.

```javascript
api.searchCustomers({ and: [{ segment: { id: 7 } }] }, { limit: 100 });
```

#### Options

- **filter**: A segment/attribute filter expression (and/or/not) (required)
- **options**: Object (optional) — `start`, `limit`

### api.getCustomersAttributes(ids)

Look up attributes and devices for a set of people in one request.

```javascript
api.getCustomersAttributes(["1", "2", "3"]);
```

#### Options

- **ids**: A non-empty array of customer identifiers (required)

### api.getObjectAttributes(objectTypeId, objectId, idType)

Get an object's attributes.

```javascript
api.getObjectAttributes(1, "acme", "object_id");
```

#### Options

- **objectTypeId**: The object type's numeric id (required)
- **objectId**: The object's identifier value (required)
- **idType**: One of "object_id" / "cio_object_id" (defaults to "object_id")

### api.getObjectRelationships(objectTypeId, objectId, options)

Get an object's relationships to people.

```javascript
api.getObjectRelationships(1, "acme", { limit: 20 });
```

#### Options

- **objectTypeId**: The object type's numeric id (required)
- **objectId**: The object's identifier value (required)
- **options**: Object (optional) — `idType` ("object_id" / "cio_object_id"), `start`, `limit`

### api.findObjects(objectTypeId, filter, options)

Find objects of a given type matching a filter expression.

```javascript
api.findObjects(1, { and: [{ attribute: { field: "plan", operator: "eq", value: "pro" } }] });
```

#### Options

- **objectTypeId**: The object type's numeric id (required)
- **filter**: A filter expression (and/or/not) (required)
- **options**: Object (optional) — `start`, `limit`

### api.listObjectTypes()

List the object types defined in your workspace.

```javascript
api.listObjectTypes();
```

### api.listActivities(options)

List activities across your workspace.

```javascript
api.listActivities({ type: "event", customerId: "1", idType: IdentifierType.Id });
```

#### Options

- **options**: Object (optional) — `start`, `limit`, `type`, `name`, `deleted`, `customerId`, `idType`

### api.listSegments()

List the segments in your workspace.

```javascript
api.listSegments();
```

### api.createSegment(segment)

Create a manual segment.

```javascript
api.createSegment({ name: "VIPs", description: "High-value customers" });
```

#### Options

- **segment**: Object (required) — `name` (required) and optional `description`

### api.getSegment(segmentId)

Get a single segment's metadata.

```javascript
api.getSegment(7);
```

#### Options

- **segmentId**: The segment's numeric id (required)

### api.deleteSegment(segmentId)

Delete a manual segment.

```javascript
api.deleteSegment(7);
```

#### Options

- **segmentId**: The segment's numeric id (required)

### api.getSegmentCustomerCount(segmentId)

Get the number of people in a segment.

```javascript
api.getSegmentCustomerCount(7);
```

#### Options

- **segmentId**: The segment's numeric id (required)

### api.getSegmentMembership(segmentId, options)

List the people who belong to a segment.

```javascript
api.getSegmentMembership(7, { limit: 100 });
```

#### Options

- **segmentId**: The segment's numeric id (required)
- **options**: Object (optional) — `start`, `limit`

### api.getSegmentUsedBy(segmentId)

Get the campaigns, newsletters, and other resources that use a segment.

```javascript
api.getSegmentUsedBy(7);
```

#### Options

- **segmentId**: The segment's numeric id (required)

### api.listSubscriptionTopics()

List the subscription topics defined in your workspace.

```javascript
api.listSubscriptionTopics();
```

### api.listSubscriptionChannels()

List the subscription channels configured in your workspace.

```javascript
api.listSubscriptionChannels();
```

### api.getSubscriptionCenterToken(customerId)

Generate a subscription center token for a person, used to authenticate a hosted subscription-center link.

```javascript
api.getSubscriptionCenterToken("1");
```

#### Options

- **customerId**: The person's identifier value (required)

### api.listTransactionalMessages()

List the transactional messages in your workspace.

```javascript
api.listTransactionalMessages();
```

### api.getTransactionalMessage(transactionalId)

Get a single transactional message's metadata.

```javascript
api.getTransactionalMessage(3);
```

#### Options

- **transactionalId**: The transactional message's numeric id (required)

### api.getTransactionalMessageContents(transactionalId)

List all content variants of a transactional message.

```javascript
api.getTransactionalMessageContents(3);
```

#### Options

- **transactionalId**: The transactional message's numeric id (required)

### api.getTransactionalMessageLanguage(transactionalId, language)

Get a single-language translation of a transactional message.

```javascript
api.getTransactionalMessageLanguage(3, "en-US");
```

#### Options

- **transactionalId**: The transactional message's numeric id (required)
- **language**: The IETF language tag of the translation (required)

### api.updateTransactionalMessageLanguage(transactionalId, language, data)

Update a single-language translation of a transactional message.

```javascript
api.updateTransactionalMessageLanguage(3, "en-US", { subject: "Welcome!" });
```

#### Options

- **transactionalId**: The transactional message's numeric id (required)
- **language**: The IETF language tag of the translation (required)
- **data**: The translation fields to update

### api.getTransactionalMessageDeliveries(transactionalId, options)

Get the individual deliveries (sends) of a transactional message.

```javascript
api.getTransactionalMessageDeliveries(3, { metric: "delivered", limit: 50 });
```

#### Options

- **transactionalId**: The transactional message's numeric id (required)
- **options**: Object (optional) — `start`, `limit`, `metric`, `start_ts`, `end_ts`, `get_tracked_responses`

### api.getTransactionalMessageMetrics(transactionalId, options)

Get delivery metrics for a transactional message over time.

```javascript
api.getTransactionalMessageMetrics(3, { period: "days", steps: 14 });
```

#### Options

- **transactionalId**: The transactional message's numeric id (required)
- **options**: Object (optional) — `period` ("hours" / "days" / "weeks" / "months"), `steps`

### api.getTransactionalMessageLinkMetrics(transactionalId, options)

Get link (click) metrics for a transactional message over time.

```javascript
api.getTransactionalMessageLinkMetrics(3, { period: "weeks", steps: 4, unique: true });
```

#### Options

- **transactionalId**: The transactional message's numeric id (required)
- **options**: Object (optional) — `period`, `steps`, `unique`

### api.updateTransactionalMessageContent(transactionalId, contentId, data)

Update a transactional message's content variant.

```javascript
api.updateTransactionalMessageContent(3, 5, { body: "Updated body" });
```

#### Options

- **transactionalId**: The transactional message's numeric id (required)
- **contentId**: The content variant's numeric id (required)
- **data**: The content fields to update

### api.listExports()

Return a list of your exports. Exports are point-in-time people or campaign metrics.

```javascript
api.listExports();
```

### api.getExport(export_id)

Return information about a specific export.

```javascript
api.getExport(1);
```

#### Options

- **export_id**: String or number (required)

### api.downloadExport(export_id)

This endpoint returns a signed link to download an export. The link expires after 15 minutes.

```javascript
api.downloadExport(1);
```

#### Options

- **export_id**: String or number (required)

### api.createCustomersExport(filters)

Provide filters and attributes describing the customers you want to export. This endpoint returns export metadata; use the /exports/{export_id}/endpoint to download your export.

```javascript
api.createCustomersExport({
  filters: {
    and: [
      {
        segment: {
          id: 3,
        },
      },
    ],
  },
});
```

#### Options

- **filters**: Object (required)

You can read more about the filter object syntax on the [export customer data](https://customer.io/docs/api/#operation/exportPeopleData) docs.

### api.createDeliveriesExport(newsletter_id, options)

Provide filters and attributes describing the customers you want to export. This endpoint returns export metadata; use the /exports/{export_id}/endpoint to download your export.

```javascript
api.createDeliveriesExport(1, {
  start: 1666950084,
  end: 1666950084,
  attributes: ["attr_one"],
  metric: "attempted",
  drafts: false,
});
```

#### Options

- **newsletter_id**: String or number (required)
- **options**: Object

You can read more about the available options on the [export deliveries data](https://customer.io/docs/api/#operation/exportDeliveriesData) docs.

### api.listCampaigns()

List the campaigns in your workspace.

```javascript
api.listCampaigns();
```

### api.getCampaign(campaignId)

Get a single campaign's metadata.

```javascript
api.getCampaign(9);
```

#### Options

- **campaignId**: The campaign's numeric id (required)

### api.getCampaignActions(campaignId, options)

List a campaign's actions.

```javascript
api.getCampaignActions(9, { start: "cursor" });
```

#### Options

- **campaignId**: The campaign's numeric id (required)
- **options**: Object (optional) — `start` (pagination cursor)

### api.getCampaignAction(campaignId, actionId)

Get a single action of a campaign.

```javascript
api.getCampaignAction(9, 2);
```

#### Options

- **campaignId**: The campaign's numeric id (required)
- **actionId**: The action's numeric id (required)

### api.updateCampaignAction(campaignId, actionId, data)

Update an action of a campaign.

```javascript
api.updateCampaignAction(9, 2, { body: "Updated body" });
```

#### Options

- **campaignId**: The campaign's numeric id (required)
- **actionId**: The action's numeric id (required)
- **data**: The action fields to update

### api.getCampaignActionLanguage(campaignId, actionId, language)

Get a single-language translation of a campaign action.

```javascript
api.getCampaignActionLanguage(9, 2, "en-US");
```

#### Options

- **campaignId**: The campaign's numeric id (required)
- **actionId**: The action's numeric id (required)
- **language**: The IETF language tag (required)

### api.updateCampaignActionLanguage(campaignId, actionId, language, data)

Update a single-language translation of a campaign action.

```javascript
api.updateCampaignActionLanguage(9, 2, "fr", { subject: "Bonjour" });
```

#### Options

- **campaignId**: The campaign's numeric id (required)
- **actionId**: The action's numeric id (required)
- **language**: The IETF language tag (required)
- **data**: The translation fields to update

### api.getCampaignActionMetrics(campaignId, actionId, options)

Get metrics for a single campaign action over time. Aggregated across all channels (no `type` filter).

```javascript
api.getCampaignActionMetrics(9, 2, { version: "2", period: "days", steps: 7 });
```

#### Options

- **campaignId**: The campaign's numeric id (required)
- **actionId**: The action's numeric id (required)
- **options**: Object (optional) — `version` ("1" / "2"), `res`, `tz`, `start`, `end`, `period`, `steps`

### api.getCampaignActionMetricsLinks(campaignId, actionId, options)

Get link (click) metrics for a single campaign action over time.

```javascript
api.getCampaignActionMetricsLinks(9, 2, { period: "weeks", steps: 4, unique: true });
```

#### Options

- **campaignId**: The campaign's numeric id (required)
- **actionId**: The action's numeric id (required)
- **options**: Object (optional) — `period`, `steps`, `unique`

### api.getCampaignMetrics(campaignId, options)

Get delivery metrics for a campaign over time.

```javascript
api.getCampaignMetrics(9, { version: "1", res: "daily", start: 1719792000, end: 1719878400 });
```

#### Options

- **campaignId**: The campaign's numeric id (required)
- **options**: Object (optional) — `version` ("1" / "2"), `type`, `res`, `tz`, `start`, `end`, `period`, `steps`

### api.getCampaignMetricsLinks(campaignId, options)

Get link (click) metrics for a campaign over time.

```javascript
api.getCampaignMetricsLinks(9, { period: "days", steps: 30, unique: true });
```

#### Options

- **campaignId**: The campaign's numeric id (required)
- **options**: Object (optional) — `period`, `steps`, `unique`

### api.getCampaignJourneyMetrics(campaignId, options)

Get a campaign's journey metrics (per-step conversion funnel) over a window.

```javascript
api.getCampaignJourneyMetrics(9, { start: 1719792000, end: 1719878400, res: "daily" });
```

#### Options

- **campaignId**: The campaign's numeric id (required)
- **options**: Object (required) — `start`, `end`, and `res` are all required

### api.getCampaignMessages(campaignId, options)

Get the individual messages (deliveries) sent by a campaign.

```javascript
api.getCampaignMessages(9, { type: "email", metric: "delivered", limit: 50 });
```

#### Options

- **campaignId**: The campaign's numeric id (required)
- **options**: Object (optional) — `start`, `limit`, `type`, `metric`, `drafts`, `start_ts`, `end_ts`, `get_tracked_responses`

### api.getBroadcastTriggerStatus(broadcastId, triggerId)

Get the status of an API-triggered broadcast run. Pairs with `api.triggerBroadcast`.

```javascript
api.getBroadcastTriggerStatus(1, 5);
```

#### Options

- **broadcastId**: The broadcast (campaign) id (required)
- **triggerId**: The trigger id returned by `triggerBroadcast` (required)

### api.getBroadcastTriggerErrors(broadcastId, triggerId, options)

Get the per-recipient errors for an API-triggered broadcast run.

```javascript
api.getBroadcastTriggerErrors(1, 5, { limit: 100 });
```

#### Options

- **broadcastId**: The broadcast (campaign) id (required)
- **triggerId**: The trigger id (required)
- **options**: Object (optional) — `start`, `limit`

### api.listBroadcasts()

List the broadcasts in your workspace.

```javascript
api.listBroadcasts();
```

### api.getBroadcast(broadcastId)

Get a single broadcast's metadata.

```javascript
api.getBroadcast(4);
```

#### Options

- **broadcastId**: The broadcast's numeric id (required)

### api.getBroadcastActions(broadcastId)

List a broadcast's actions.

```javascript
api.getBroadcastActions(4);
```

#### Options

- **broadcastId**: The broadcast's numeric id (required)

### api.getBroadcastAction(broadcastId, actionId)

Get a single action of a broadcast.

```javascript
api.getBroadcastAction(4, 2);
```

#### Options

- **broadcastId**: The broadcast's numeric id (required)
- **actionId**: The action's numeric id (required)

### api.updateBroadcastAction(broadcastId, actionId, data)

Update an action of a broadcast.

```javascript
api.updateBroadcastAction(4, 2, { body: "Updated body" });
```

#### Options

- **broadcastId**: The broadcast's numeric id (required)
- **actionId**: The action's numeric id (required)
- **data**: The action fields to update

### api.getBroadcastActionLanguage(broadcastId, actionId, language)

Get a single-language translation of a broadcast action.

```javascript
api.getBroadcastActionLanguage(4, 2, "en-US");
```

#### Options

- **broadcastId**: The broadcast's numeric id (required)
- **actionId**: The action's numeric id (required)
- **language**: The IETF language tag (required)

### api.updateBroadcastActionLanguage(broadcastId, actionId, language, data)

Update a single-language translation of a broadcast action.

```javascript
api.updateBroadcastActionLanguage(4, 2, "fr", { subject: "Bonjour" });
```

#### Options

- **broadcastId**: The broadcast's numeric id (required)
- **actionId**: The action's numeric id (required)
- **language**: The IETF language tag (required)
- **data**: The translation fields to update

### api.getBroadcastActionMetrics(broadcastId, actionId, options)

Get metrics for a single broadcast action over time. Aggregated across all channels (no `type` filter).

```javascript
api.getBroadcastActionMetrics(4, 2, { period: "days", steps: 7 });
```

#### Options

- **broadcastId**: The broadcast's numeric id (required)
- **actionId**: The action's numeric id (required)
- **options**: Object (optional) — `period`, `steps`

### api.getBroadcastActionMetricsLinks(broadcastId, actionId, options)

Get link (click) metrics for a single broadcast action over time.

```javascript
api.getBroadcastActionMetricsLinks(4, 2, { period: "weeks", steps: 4, unique: true });
```

#### Options

- **broadcastId**: The broadcast's numeric id (required)
- **actionId**: The action's numeric id (required)
- **options**: Object (optional) — `period`, `steps`, `unique`

### api.getBroadcastMetrics(broadcastId, options)

Get delivery metrics for a broadcast over time.

```javascript
api.getBroadcastMetrics(4, { period: "days", steps: 30, type: "email" });
```

#### Options

- **broadcastId**: The broadcast's numeric id (required)
- **options**: Object (optional) — `period`, `steps`, `type`

### api.getBroadcastMetricsLinks(broadcastId, options)

Get link (click) metrics for a broadcast over time.

```javascript
api.getBroadcastMetricsLinks(4, { period: "days", steps: 30, unique: true });
```

#### Options

- **broadcastId**: The broadcast's numeric id (required)
- **options**: Object (optional) — `period`, `steps`, `unique`

### api.getBroadcastMessages(broadcastId, options)

Get the individual messages (deliveries) sent by a broadcast.

```javascript
api.getBroadcastMessages(4, { metric: "delivered", type: "email", limit: 50 });
```

#### Options

- **broadcastId**: The broadcast's numeric id (required)
- **options**: Object (optional) — `start`, `limit`, `metric`, `type`, `start_ts`, `end_ts`, `get_tracked_responses`

### api.getBroadcastTriggers(broadcastId)

List the API triggers fired for a broadcast.

```javascript
api.getBroadcastTriggers(4);
```

#### Options

- **broadcastId**: The broadcast's numeric id (required)

### api.listNewsletters(options)

List the newsletters in your workspace.

```javascript
api.listNewsletters({ limit: 25, sort: "desc" });
```

#### Options

- **options**: Object (optional) — `start`, `limit`, `sort` ("asc" / "desc")

### api.createNewsletter(data)

Create a newsletter. Both `name` and `recipients` (an audience filter) are required.

```javascript
api.createNewsletter({
  name: "Weekly digest",
  recipients: { segment: { id: 7 } },
});
```

#### Options

- **data**: The newsletter definition
  - _name_: The newsletter's name, ≤190 characters (required)
  - _recipients_: An audience filter selecting who receives the newsletter (required)
  - Additional fields may be required depending on configuration (e.g. channel-specific `subject`/`body`, or `subscription_topic_id` when the subscription center is enabled)

### api.getNewsletter(newsletterId)

Get a single newsletter's metadata.

```javascript
api.getNewsletter(8);
```

#### Options

- **newsletterId**: The newsletter's numeric id (required)

### api.deleteNewsletter(newsletterId)

Delete a newsletter.

```javascript
api.deleteNewsletter(8);
```

#### Options

- **newsletterId**: The newsletter's numeric id (required)

### api.getNewsletterContents(newsletterId)

List all content variants of a newsletter.

```javascript
api.getNewsletterContents(8);
```

#### Options

- **newsletterId**: The newsletter's numeric id (required)

### api.getNewsletterContent(newsletterId, contentId)

Get a single content variant of a newsletter.

```javascript
api.getNewsletterContent(8, 3);
```

#### Options

- **newsletterId**: The newsletter's numeric id (required)
- **contentId**: The content variant's numeric id (required)

### api.updateNewsletterContent(newsletterId, contentId, data)

Update a content variant of a newsletter.

```javascript
api.updateNewsletterContent(8, 3, { subject: "Updated subject" });
```

#### Options

- **newsletterId**: The newsletter's numeric id (required)
- **contentId**: The content variant's numeric id (required)
- **data**: The content fields to update

### api.getNewsletterContentMetrics(newsletterId, contentId, options)

Get metrics for a single newsletter content variant over time.

```javascript
api.getNewsletterContentMetrics(8, 3, { period: "days", steps: 7 });
```

#### Options

- **newsletterId**: The newsletter's numeric id (required)
- **contentId**: The content variant's numeric id (required)
- **options**: Object (optional) — `period`, `steps` (newsletter metrics are always aggregated across all channels)

### api.getNewsletterContentMetricsLinks(newsletterId, contentId, options)

Get link (click) metrics for a single newsletter content variant over time.

```javascript
api.getNewsletterContentMetricsLinks(8, 3, { period: "weeks", steps: 4, unique: true });
```

#### Options

- **newsletterId**: The newsletter's numeric id (required)
- **contentId**: The content variant's numeric id (required)
- **options**: Object (optional) — `period`, `steps`, `unique`

### api.getNewsletterMetrics(newsletterId, options)

Get delivery metrics for a newsletter over time.

```javascript
api.getNewsletterMetrics(8, { period: "days", steps: 30 });
```

#### Options

- **newsletterId**: The newsletter's numeric id (required)
- **options**: Object (optional) — `period`, `steps` (newsletter metrics are always aggregated across all channels)

### api.getNewsletterMetricsLinks(newsletterId, options)

Get link (click) metrics for a newsletter over time.

```javascript
api.getNewsletterMetricsLinks(8, { period: "days", steps: 30, unique: true });
```

#### Options

- **newsletterId**: The newsletter's numeric id (required)
- **options**: Object (optional) — `period`, `steps`, `unique`

### api.getNewsletterMessages(newsletterId, options)

Get the individual messages (deliveries) sent by a newsletter.

```javascript
api.getNewsletterMessages(8, { metric: "delivered", limit: 50 });
```

#### Options

- **newsletterId**: The newsletter's numeric id (required)
- **options**: Object (optional) — `start`, `limit`, `metric`, `type` ("email" / "webhook" / "twilio" / "push" / "in_app" / "inbox"), `start_ts`, `end_ts`, `get_tracked_responses`

### api.sendNewsletter(newsletterId, data)

Send a newsletter.

```javascript
api.sendNewsletter(8, { rate_limit_email_rate: 100, rate_limit_time_period: 60 });
```

#### Options

- **newsletterId**: The newsletter's numeric id (required)
- **data**: Optional send settings — `rate_limit_email_rate`, `rate_limit_time_period`, `rate_limit_spread`

### api.scheduleNewsletter(newsletterId, data)

Schedule a newsletter to send later. `scheduled_at` (a Unix timestamp) and `timezone` are both required.

```javascript
api.scheduleNewsletter(8, { scheduled_at: 1719792000, timezone: "America/New_York" });
```

#### Options

- **newsletterId**: The newsletter's numeric id (required)
- **data**: The schedule settings
  - _scheduled_at_: Unix timestamp (seconds) when the newsletter should send (required, must be in the future)
  - _timezone_: IANA timezone the scheduled time is expressed in (required)
  - Optional: `tz_match_enabled`, `rate_limit_email_rate`, `rate_limit_time_period`, `rate_limit_spread`

### api.createNewsletterLanguage(newsletterId, data)

Add a language (translation) to a newsletter. `language` is required, and the required content fields depend on the newsletter's channel (e.g. an email newsletter requires `subject` and `body`).

```javascript
api.createNewsletterLanguage(8, { language: "fr", subject: "Bonjour", body: "<p>Bonjour&nbsp;!</p>" });
```

#### Options

- **newsletterId**: The newsletter's numeric id (required)
- **data**: The translation content
  - _language_: The IETF language tag (required)
  - _subject_ / _body_: Required for email; other channels require their own fields (e.g. `body_json` for in-app/inbox, `body` for SMS/webhook)

### api.getNewsletterLanguage(newsletterId, language)

Get a single-language translation of a newsletter.

```javascript
api.getNewsletterLanguage(8, "en-US");
```

#### Options

- **newsletterId**: The newsletter's numeric id (required)
- **language**: The IETF language tag (required)

### api.updateNewsletterLanguage(newsletterId, language, data)

Update a single-language translation of a newsletter.

```javascript
api.updateNewsletterLanguage(8, "fr", { subject: "Salut" });
```

#### Options

- **newsletterId**: The newsletter's numeric id (required)
- **language**: The IETF language tag (required)
- **data**: The translation fields to update

### api.deleteNewsletterLanguage(newsletterId, language)

Delete a single-language translation of a newsletter.

```javascript
api.deleteNewsletterLanguage(8, "fr");
```

#### Options

- **newsletterId**: The newsletter's numeric id (required)
- **language**: The IETF language tag (required)

### api.getNewsletterTestGroups(newsletterId)

List a newsletter's A/B test groups.

```javascript
api.getNewsletterTestGroups(8);
```

#### Options

- **newsletterId**: The newsletter's numeric id (required)

### api.createNewsletterTestGroup(newsletterId)

Create an A/B test group on a newsletter. The API takes no request body — a new empty test group is created.

```javascript
api.createNewsletterTestGroup(8);
```

#### Options

- **newsletterId**: The newsletter's numeric id (required)

### api.createNewsletterTestGroupLanguage(newsletterId, testGroupId, data)

Add a language (translation) to a newsletter test group. Same content requirements as `createNewsletterLanguage` (`language` required, plus channel-specific fields such as `subject`/`body` for email).

```javascript
api.createNewsletterTestGroupLanguage(8, 2, { language: "fr", subject: "Bonjour", body: "<p>Bonjour&nbsp;!</p>" });
```

#### Options

- **newsletterId**: The newsletter's numeric id (required)
- **testGroupId**: The test group's id (required)
- **data**: The translation content (`language` required; channel-specific content fields required)

### api.getNewsletterTestGroupLanguage(newsletterId, testGroupId, language)

Get a single-language translation of a newsletter test group.

```javascript
api.getNewsletterTestGroupLanguage(8, 2, "en-US");
```

#### Options

- **newsletterId**: The newsletter's numeric id (required)
- **testGroupId**: The test group's id (required)
- **language**: The IETF language tag (required)

### api.updateNewsletterTestGroupLanguage(newsletterId, testGroupId, language, data)

Update a single-language translation of a newsletter test group.

```javascript
api.updateNewsletterTestGroupLanguage(8, 2, "fr", { subject: "Salut" });
```

#### Options

- **newsletterId**: The newsletter's numeric id (required)
- **testGroupId**: The test group's id (required)
- **language**: The IETF language tag (required)
- **data**: The translation fields to update

### api.deleteNewsletterTestGroupLanguage(newsletterId, testGroupId, language)

Delete a single-language translation of a newsletter test group.

```javascript
api.deleteNewsletterTestGroupLanguage(8, 2, "fr");
```

#### Options

- **newsletterId**: The newsletter's numeric id (required)
- **testGroupId**: The test group's id (required)
- **language**: The IETF language tag (required)

## Design Studio

Manage Design Studio folders and emails. Folders and emails are "nodes" identified by a UUID.

The list endpoints share a common set of filters, sorting, and page-based pagination (they do **not** use the cursor pagination of the other App API list endpoints):

- **parentFolderId**: Only list nodes directly within this folder (omit for the root)
- **directDescendantsOnly**: When `true`, return only direct children rather than the whole subtree
- **sortBy**: `"created"` / `"updated"` / `"name"` (default `"created"`)
- **sortOrder**: `"asc"` / `"desc"` (default `"asc"`)
- **createdBefore** / **createdAfter** / **updatedBefore** / **updatedAfter**: Unix timestamps (seconds)
- **page**: 1-based page number (default 1)
- **limit**: page size, 1–10000 (default 1000)

In folder and email bodies, `parent_folder_id` is tri-state: **omit** it to keep the current parent, pass `null` to move to the root, or pass a folder UUID to move it into that folder.

### api.listDesignStudioFolders(options)

List Design Studio folders.

```javascript
api.listDesignStudioFolders({ parentFolderId: "1f0…", directDescendantsOnly: true, limit: 50 });
```

#### Options

- **options**: Object (optional) — the shared list filters described above

### api.createDesignStudioFolder(folder)

Create a folder.

```javascript
api.createDesignStudioFolder({ name: "Campaigns", parent_folder_id: null });
```

#### Options

- **folder**: The folder definition
  - _name_: The folder's display name (required)
  - _parent_folder_id_: Parent folder UUID, or `null`/omit for the root

### api.getDesignStudioFolder(folderId)

Get a single folder.

```javascript
api.getDesignStudioFolder("1f0…");
```

#### Options

- **folderId**: The folder's UUID (required)

### api.updateDesignStudioFolder(folderId, updates)

Update a folder. At least one field must be provided. Returns no content on success.

```javascript
api.updateDesignStudioFolder("1f0…", { name: "Renamed", parent_folder_id: null });
```

#### Options

- **folderId**: The folder's UUID (required)
- **updates**: Object with any of `name`, `parent_folder_id`

### api.deleteDesignStudioFolder(folderId)

Delete a folder. Returns no content on success.

```javascript
api.deleteDesignStudioFolder("1f0…");
```

#### Options

- **folderId**: The folder's UUID (required)

### api.listDesignStudioEmails(options)

List Design Studio emails. In addition to the shared list filters, emails support three tri-state filters — each `"true"`, `"false"`, or `"any"` (no filter).

```javascript
api.listDesignStudioEmails({ isTemplate: "true", hasTranslations: "any", limit: 25 });
```

#### Options

- **options**: Object (optional) — the shared list filters, plus:
  - _isTemplate_: `"true"` / `"false"` / `"any"`
  - _hasTranslations_: `"true"` / `"false"` / `"any"`
  - _isLinked_: `"true"` / `"false"` / `"any"` (whether the email is linked to a message)

### api.createDesignStudioEmail(email)

Create an email.

```javascript
api.createDesignStudioEmail({
  name: "Welcome",
  is_template: false,
  content: { subject: "Welcome!", html: "<p>Hi {{customer.first_name}}</p>" },
  envelope: { recipient: "{{customer.email}}" },
});
```

#### Options

- **email**: The email definition
  - _name_: The email's display name (required)
  - _parent_folder_id_: Parent folder UUID, or `null`/omit for the root
  - _is_template_: Whether the email is a reusable template
  - _content_: `{ subject, preheader_text, html, amp, text }`
  - _envelope_: `{ from_id, reply_to_id, recipient, bcc, fake_bcc, cc, headers }`
  - _transformers_: Content transformers (e.g. `url_parameters`, `css_inliner`, `accessibility`)

### api.getDesignStudioEmail(emailId)

Get a single email.

```javascript
api.getDesignStudioEmail("2a1…");
```

#### Options

- **emailId**: The email's UUID (required)

### api.updateDesignStudioEmail(emailId, updates)

Update an email. At least one field must be provided. Returns no content on success.

```javascript
api.updateDesignStudioEmail("2a1…", { is_template: true, content: { subject: "Updated" } });
```

#### Options

- **emailId**: The email's UUID (required)
- **updates**: Object with any of `name`, `parent_folder_id`, `is_template`, `content`, `envelope`, `transformers`

### api.deleteDesignStudioEmail(emailId)

Delete an email. Returns no content on success.

```javascript
api.deleteDesignStudioEmail("2a1…");
```

#### Options

- **emailId**: The email's UUID (required)

### api.listDesignStudioEmailLanguages(emailId)

List the translations (languages) of an email.

```javascript
api.listDesignStudioEmailLanguages("2a1…");
```

#### Options

- **emailId**: The email's UUID (required)

### api.createDesignStudioEmailLanguage(emailId, translation)

Create a translation of an email. Content blocks you omit are inherited from the default-language email.

```javascript
api.createDesignStudioEmailLanguage("2a1…", {
  language: "fr",
  content: { subject: "Bonjour" },
});
```

#### Options

- **emailId**: The email's UUID (required)
- **translation**: The translation definition
  - _language_: IETF language tag (required)
  - _content_: `{ subject, preheader_text, html, amp, text }`
  - _envelope_: `{ from_id, reply_to_id, recipient, bcc, fake_bcc, cc, headers }`
  - _transformers_: Content transformers

### api.getDesignStudioEmailLanguage(emailId, language)

Get a single-language translation of an email.

```javascript
api.getDesignStudioEmailLanguage("2a1…", "fr");
```

#### Options

- **emailId**: The email's UUID (required)
- **language**: The IETF language tag (required)

### api.updateDesignStudioEmailLanguage(emailId, language, updates)

Update a translation. At least one field must be provided. The language itself is immutable. Returns no content on success.

```javascript
api.updateDesignStudioEmailLanguage("2a1…", "fr", { content: { subject: "Salut" } });
```

#### Options

- **emailId**: The email's UUID (required)
- **language**: The IETF language tag (required)
- **updates**: Object with any of `content`, `envelope`, `transformers`

### api.deleteDesignStudioEmailLanguage(emailId, language)

Delete a translation. Returns no content on success.

```javascript
api.deleteDesignStudioEmailLanguage("2a1…", "fr");
```

#### Options

- **emailId**: The email's UUID (required)
- **language**: The IETF language tag (required)

### api.listDesignStudioComponents(options)

List Design Studio components.

```javascript
api.listDesignStudioComponents({ tag: "header", limit: 25 });
```

#### Options

- **options**: Object (optional) — the shared list filters described above, plus:
  - _tag_: Only list components with this tag

### api.createDesignStudioComponent(component)

Create a component.

```javascript
api.createDesignStudioComponent({ name: "Header", tag: "header", content: "<div>…</div>" });
```

#### Options

- **component**: The component definition
  - _name_: The component's display name (required)
  - _tag_: The component's tag, unique per workspace (required)
  - _parent_folder_id_: Parent folder UUID, or `null`/omit for the root
  - _content_: The component's HTML content

### api.getDesignStudioComponent(componentId)

Get a single component.

```javascript
api.getDesignStudioComponent("3b2…");
```

#### Options

- **componentId**: The component's UUID (required)

### api.updateDesignStudioComponent(componentId, updates)

Update a component. At least one field must be provided. Returns no content on success.

```javascript
api.updateDesignStudioComponent("3b2…", { content: "<div>updated</div>" });
```

#### Options

- **componentId**: The component's UUID (required)
- **updates**: Object with any of `name`, `tag`, `parent_folder_id`, `content`

### api.deleteDesignStudioComponent(componentId)

Delete a component. Returns no content on success.

```javascript
api.deleteDesignStudioComponent("3b2…");
```

#### Options

- **componentId**: The component's UUID (required)

## Assets

Manage uploaded files (images, PDFs) and the folders that organize them. Asset and folder ids are **integers**.

The list endpoints share folder filtering and page-based pagination:

- **parentFolderId**: Only list items within this folder id (omit for all/root)
- **directDescendantsOnly**: When `true`, return only direct children rather than the whole subtree
- **page**: 1-based page number (default 1)
- **limit**: page size, 1–10000 (default 1000)

On file and folder updates, `parent_folder_id` is tri-state: **omit** to keep the current parent, pass `null` to move to the root, or pass a folder id to move it.

### api.listAssets(options)

List uploaded files.

```javascript
api.listAssets({ parentFolderId: 5, limit: 50 });
```

#### Options

- **options**: Object (optional) — `parentFolderId`, `directDescendantsOnly`, `page`, `limit`

### api.createAsset(file)

Upload a file (`multipart/form-data`). The API accepts images (`image/bmp`, `image/jpeg`, `image/jpg`, `image/png`, `image/gif`) and `application/pdf`, up to 2 MB (images max 4096px per side).

```javascript
const fs = require("fs");

api.createAsset({
  data: fs.readFileSync("logo.png"),
  filename: "logo.png",
  contentType: "image/png",
  parentFolderId: 5,
});
```

#### Options

- **file**: The upload definition
  - _data_: File contents — any `Buffer`/`Blob`-compatible value (required)
  - _filename_: Filename; also the default asset name and, when `contentType` is omitted, the source for the derived content type (required)
  - _contentType_: MIME type of the upload; when omitted the SDK derives it from the filename extension (`.bmp`, `.jpg`/`.jpeg`, `.png`, `.gif`, `.pdf`)
  - _name_: Asset name; defaults to `filename`
  - _parentFolderId_: Parent folder id; omit for the root

### api.getAsset(assetId)

Get a single file.

```javascript
api.getAsset(42);
```

#### Options

- **assetId**: The asset's numeric id (required)

### api.updateAsset(assetId, updates)

Rename and/or move a file. At least one field must be provided; the file bytes cannot be changed. Returns no content on success.

```javascript
api.updateAsset(42, { name: "renamed.png", parent_folder_id: null });
```

#### Options

- **assetId**: The asset's numeric id (required)
- **updates**: Object with any of `name`, `parent_folder_id`

### api.deleteAsset(assetId)

Delete a file. Returns no content on success.

```javascript
api.deleteAsset(42);
```

#### Options

- **assetId**: The asset's numeric id (required)

### api.listAssetFolders(options)

List asset folders.

```javascript
api.listAssetFolders({ parentFolderId: 5, limit: 50 });
```

#### Options

- **options**: Object (optional) — `parentFolderId`, `directDescendantsOnly`, `page`, `limit`

### api.createAssetFolder(folder)

Create an asset folder.

```javascript
api.createAssetFolder({ name: "Product images", parent_folder_id: 5 });
```

#### Options

- **folder**: The folder definition
  - _name_: The folder's display name (required)
  - _parent_folder_id_: Parent folder id; omit for the root

### api.getAssetFolder(folderId)

Get a single asset folder.

```javascript
api.getAssetFolder(5);
```

#### Options

- **folderId**: The folder's numeric id (required)

### api.updateAssetFolder(folderId, updates)

Rename and/or move a folder. At least one field must be provided. Returns no content on success.

```javascript
api.updateAssetFolder(5, { name: "Renamed", parent_folder_id: null });
```

#### Options

- **folderId**: The folder's numeric id (required)
- **updates**: Object with any of `name`, `parent_folder_id`

### api.deleteAssetFolder(folderId)

Delete an asset folder. The folder must be empty.

```javascript
api.deleteAssetFolder(5);
```

#### Options

- **folderId**: The folder's numeric id (required)

## Collections

Manage [data collections](https://customer.io/docs/journeys/collections/) — reusable datasets you can reference from messages. Collection ids are **integers**.

### api.listCollections()

List the collections in your workspace.

```javascript
api.listCollections();
```

### api.createCollection(collection)

Create a collection. Provide inline `data` **or** a source `url`, not both.

```javascript
api.createCollection({
  name: "Plans",
  data: [
    { tier: "free", price: 0 },
    { tier: "pro", price: 20 },
  ],
});
```

#### Options

- **collection**: The collection definition
  - _name_: The collection's name (required)
  - _data_: An array of row objects (mutually exclusive with `url`)
  - _url_: A source URL to import rows from — CSV/JSON/Google Sheet (mutually exclusive with `data`)

### api.getCollection(collectionId)

Get a single collection's metadata (`name`, `schema`, `rows`, `bytes`, timestamps). Use `getCollectionContent` for the rows themselves.

```javascript
api.getCollection(9);
```

#### Options

- **collectionId**: The collection's numeric id (required)

### api.updateCollection(collectionId, updates)

Update a collection. Any subset of fields may be provided; `data` and `url` are mutually exclusive.

```javascript
api.updateCollection(9, { name: "Renamed" });
```

#### Options

- **collectionId**: The collection's numeric id (required)
- **updates**: Object with any of `name`, `data`, `url`

### api.deleteCollection(collectionId)

Delete a collection. Returns no content on success. Fails if the collection is still referenced by a campaign.

```javascript
api.deleteCollection(9);
```

#### Options

- **collectionId**: The collection's numeric id (required)

### api.getCollectionContent(collectionId)

Get a collection's content — the full array of data rows.

```javascript
api.getCollectionContent(9);
```

#### Options

- **collectionId**: The collection's numeric id (required)

### api.updateCollectionContent(collectionId, content)

Replace a collection's content with a new array of data rows.

```javascript
api.updateCollectionContent(9, [
  { tier: "free", price: 0 },
  { tier: "pro", price: 20 },
]);
```

#### Options

- **collectionId**: The collection's numeric id (required)
- **content**: An array of row objects (required)
