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
