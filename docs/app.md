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
