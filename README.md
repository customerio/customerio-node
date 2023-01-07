<p align="center">
  <a href="https://customer.io">
    <img src="https://user-images.githubusercontent.com/6409227/144680509-907ee093-d7ad-4a9c-b0a5-f640eeb060cd.png" height="60">
  </a>
  <p align="center">Power automated communication that people like to receive.</p>
</p>

[![Gitpod Ready-to-Code](https://img.shields.io/badge/Gitpod-Ready--to--Code-blueviolet?logo=gitpod)](https://gitpod.io/#https://github.com/customerio/customerio-node/)
[![ci](https://github.com/customerio/customerio-node/actions/workflows/main.yml/badge.svg)](https://github.com/customerio/customerio-node/actions/workflows/main.yml)

# Customer.io Node

A node client for the Customer.io [REST API](https://customer.io/docs/api/).

## Alternative Node runtimes

This project is developed for and tested against the latest and LTS versions of Node.js. Many runtimes often have subtle differences to the APIs and standard library offered by Node.js. These differences can cause issues when using this library with those runtimes.

If you would like to use Customer.io with an alternate runtime, we recommend using either our [Track](https://customer.io/docs/api/#tag/trackOverview) and [App](https://customer.io/docs/api/#tag/appOverview) APIs directly using the built-in HTTP client available in your runtime, or our [React Native SDK](https://customer.io/docs/sdk/react-native/getting-started/) if applicable.

## Installation

```
npm i --save customerio-node
```

## Usage

### Creating a new instance

To start using the library, you first need to create an instance of the CIO class:

```javascript
const { TrackClient, RegionUS, RegionEU } = require("customerio-node");
let cio = new TrackClient(siteId, apiKey, { region: RegionUS });
```

Both the `siteId` and `apiKey` are **required** to create a Basic Authorization header, allowing us to associate the data with your account.

Your account `region` is optional. If you do not specify your region, the default will be the US region (`RegionUS`). If your account is in the EU and you do not provide the correct region, we'll route requests from the US to `RegionEU` accordingly. This may cause data to be logged in the US.

Optionally you can specify `defaults` that will forwarded to the underlying request instance. The [node `http` docs](https://nodejs.org/api/http.html#http_http_request_options_callback) has a list of the possible options.

This is useful to override the default 10s timeout. Example:

```
const cio = new TrackClient('123', 'abc', {
  timeout: 5000
});
```

---

### cio.identify(id, data)

Creating a person is as simple as identifying them with this call. You can also use this method to update a persons data.

```
cio.identify(1, {
  email: 'customer@example.com',
  created_at: 1361205308,
  first_name: 'Bob',
  plan: 'basic'
});
```

#### Options

- **id**: String or number (required)
- **data**: Object (optional)
  - _email_ is a required key if you intend to send email messages
  - _created_at_ is a required key if you want to segment based on signed up/created date

#### Updating identifiers

If you want to update an identifier for an existing profile, you must reference them using their `cio_id` in the format `cio_<cio_id_value>`. Using anything else will result in an attribute update failure in Customer.io. You can read more about [updating customers](https://customer.io/docs/api/#operation/identify) on our API documentation.

```
cio.identify(`cio_${customer.cio_id}`, {
  email: 'new_email@example.com'
});
```

---

### cio.destroy(id)

This will delete a person from Customer.io.

```
cio.destroy(1);
```

#### Options

- **id**: String or number (required)

#### Attention!

This method will only delete a person and not suppress them. This means they can be readded.
If you need to suppress a person, please use [`cio.suppress`](https://github.com/customerio/customerio-node#ciosuppressid).

---

### Merge Customers

When you merge two people, you pick a primary person and merge a secondary, duplicate person into it. The primary person remains after the merge and the secondary is deleted. This process is permanent: you cannot recover the secondary person.

The first and third parameters represent the identifier for the primary and secondary people respectively—one of `id`, `email`, or `cio_id`. The second and fourth parameters are the identifier values for the primary and secondary people respectively.

```javascript
// cio.mergeCustomers("primaryType", "primaryIdentifier", "secondaryType", "secondaryIdentifier")
// primaryType / secondaryType are one of "id", "email", or "cio_id"
// primaryIdentifier / secondaryIdentifier are the identifier value corresponding to the type.
cio.mergeCustomers(IdentifierType.Id, "cool.person@company.com", IdentifierType.Email, "cperson@gmail.com");
```

#### Options

- **primaryType**: One of the ID types - "id" / "email" / "cio_id" (required)
- **primaryIdentifier**: Primary profile Identifier, String or number (required)
- **secondaryType**: One of the ID types - "id" / "email" / "cio_id" (required)
- **secondaryIdentifier**: Secondary profile Identifier, String or number (required)

---

### cio.track(id, data)

The track method will trigger events within Customer.io. Customer.io requires a name key/value pair in you data object when sending data along with your event.

**Simple event tracking**

```javascript
cio.track(1, { name: "updated" });
```

**Sending data with an event**

```javascript
cio.track(1, {
  name: "purchase",
  data: {
    price: "23.45",
    product: "socks",
  },
});
```

#### Options

- **id**: String or number (required)
- **data**: Object (required)
  - _name_ is a required key on the Object
  - _data_ is an optional key for additional data sent over with the event

---

### cio.trackAnonymous(anonymous_id, data)

Track an anonymous event. An anonymous event is an event associated with a person you haven't identified, requiring an `anonymous_id` representing the unknown person and an event `name`. When you identify a person, you can set their `anonymous_id` attribute. If [event merging](https://customer.io/docs/anonymous-events/#turn-on-merging) is turned on in your workspace, and the attribute matches the `anonymous_id` in one or more events that were logged within the last 30 days, we associate those events with the person.

Anonymous events cannot trigger campaigns. If you associate an event with a person within 72 hours of the event timestamp, however, a formerly anonymous event can trigger a campaign.

```javascript
cio.trackAnonymous(anonymous_id, {
  name: "updated",
  data: {
    updated: true,
    plan: "free",
  },
});
```

#### Anonymous invite events

If you previously sent [invite events](https://customer.io/docs/anonymous-invite-emails/), you can achieve the same functionality by sending an anonymous event with an empty string for the anonymous identifier. To send anonymous invites, your event _must_ include a `recipient` attribute.

```javascript
cio.trackAnonymous("", {
  name: "invite",
  data: {
    name: "Alex",
    recipient: "alex.person@example.com",
  },
});
```

#### Options

- **anonymous_id**: String or number (required)
- **data**: Object (required)
  - _name_ is a required key on the Object
  - _data_ is an optional key for additional data sent over with the event

---

### cio.trackPageView(id, url)

Sending a page event includes sending over the customers id and the name of the page.

```javascript
cio.trackPageView(1, "/home");
```

#### Options

- **id**: String or number (required)
- **url**: String (required)

### cio.addDevice(id, device_id, platform, data)

Add a device to send push notifications.

```javascript
cio.addDevice(1, "device_id", "ios", { primary: true });
```

#### Options

- **customer_id**: String or number (required)
- **device_id**: String (required)
- **platform**: String (required)
- **data**: Object (optional)

### cio.deleteDevice(id, device_id)

Delete a device to remove it from the associated customer and stop sending push notifications to it.

```javascript
cio.deleteDevice(1, "device_token");
```

#### Options

- **customer_id**: String or number (required)
- **device_token**: String (required)

### cio.suppress(id)

Suppress a customer.

```javascript
cio.suppress(1);
```

#### Options

- **customer_id**: String or number (required)

### cio.unsuppress(id)

Unsuppress a customer.

```javascript
cio.unsuppress(1);
```

#### Options

- **customer_id**: String or number (required)

### Using Promises

All calls to the library will return a native promise, allowing you to chain calls as such:

```javascript
const customerId = 1;

cio.identify(customerId, { first_name: "Finn" }).then(() => {
  return cio.track(customerId, {
    name: "updated",
    data: {
      updated: true,
      plan: "free",
    },
  });
});
```

or use `async/await`:

```javascript
const customerId = 1;

await cio.identify(customerId, { first_name: "Finn" });

return cio.track(customerId, {
  name: "updated",
  data: {
    updated: true,
    plan: "free",
  },
});
```

### Transactional API

To use the Customer.io [Transactional API](https://customer.io/docs/transactional-api), import our API client and initialize it with an [app key](https://customer.io/docs/managing-credentials#app-api-keys).

Create a new `SendEmailRequest` object containing:

- `transactional_message_id`: the ID of the transactional message you want to send, or the `body`, `from`, and `subject` of a new message.
- `to`: the email address of your recipients
- an `identifiers` object containing the `id` of your recipient. If the `id` does not exist, Customer.io will create it.
- a `message_data` object containing properties that you want reference in your message using Liquid.
- You can also send attachments with your message. Use `attach` to encode attachments.

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
    id: "2",
  },
});

// (optional) attach a file to your message.
request.attach("receipt.pdf", fs.readFileSync("receipt.pdf"));

api
  .sendEmail(request)
  .then((res) => console.log(res))
  .catch((err) => console.log(err.statusCode, err.message));
```

### api.triggerBroadcast(campaign_id, data, recipients)

Trigger an email broadcast using the email campaign's id. You can also optionally pass along custom data that will be merged with the liquid template, and additional conditions to filter recipients.

```javascript
api.triggerBroadcast(1, { name: "foo" }, { segment: { id: 7 } });
```

You can also use emails or ids to select recipients, and pass optional API parameters such as `email_ignore_missing`.

```javascript
api.triggerBroadcast(1, { name: "foo" }, { emails: ["example@emails.com"], email_ignore_missing: true });
```

[You can learn more about the available recipient fields here](https://customer.io/docs/api/#operation/triggerBroadcast).

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
api.getAttributes("1", IdentifierType.Id);
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

## Further examples

We've included functional examples in the [examples/ directory](https://github.com/customerio/customerio-node/tree/main/examples) of the repo to further assist in demonstrating how to use this library to integrate with Customer.io

## Tests

```bash
npm install && npm test
```

## License

Released under the MIT license. See file [LICENSE](LICENSE) for more details.
