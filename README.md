# Customerio [![test](https://github.com/customerio/customerio-node/actions/workflows/main.yml/badge.svg)](https://github.com/customerio/customerio-node/actions/workflows/main.yml)

A node client for the Customer.io [REST API](https://learn.customer.io/api/).

## Installation

```
npm i --save customerio-node
```

## Usage

### Creating a new instance

To start using the library, you first need to create an instance of the CIO class:

```javascript
const CIO = require("customerio-node");
const { RegionUS, RegionEU } = require("customerio-node/regions");
let cio = new CIO(siteId, apiKey, { region: RegionUS }, [defaults]);
```

Both the `siteId` and `apiKey` are **required** in order to create a Basic Authorization header, allowing us to associate the data with your account.

Your account `region` is optional. If you do not specify your region, we assume that your account is based in the US (`RegionUS`). If your account is based in the EU and you do not provide the correct region, we'll route requests from the US to `RegionEU` accordingly, however this may cause data to be logged in the US.

Optionally you can pass `defaults` as an object that will be passed to the underlying request instance. A list of the possible options are listed [here](https://nodejs.org/api/http.html#http_http_request_options_callback).

This is useful to override the default 10s timeout. Example:

```
const cio = new CIO(123, 'abc', {
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

- **id**: String (required)
- **data**: Object (optional)
  - _email_ is a required key if you intend to send email messages
  - _created_at_ is a required key if you want to segment based on signed up/created date

---

### cio.destroy(id)

This will delete a person from Customer.io.

```
cio.destroy(1);
```

#### Options

- **id**: String (required)

---

### cio.track(id, data)

The track method will trigger events within Customer.io. When sending data along with your event, it is required to send a name key/value pair in you data object.

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

- **id**: String (required)
- **data**: Object (required)
  - _name_ is a required key on the Object
  - _data_ is an optional key for additional data sent over with the event

---

### cio.trackAnonymous(data)

Anonymous event tracking does not require a customer ID and these events will not be associated with a tracked profile in Customer.io

```javascript
cio.trackAnonymous({
  name: "updated",
  data: {
    updated: true,
    plan: "free",
  },
});
```

#### Options

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

- **id**: String (required)
- **url**: String (required)

### cio.addDevice(id, device_id, platform, data)

Add a device to send push notifications.

```javascript
cio.addDevice(1, "device_id", "ios", { primary: true });
```

#### Options

- **customer_id**: String (required)
- **device_id**: String (required)
- **platform**: String (required)
- **data**: Object (optional)

### cio.deleteDevice(id, device_id)

Delete a device to remove it from the associated customer and stop sending push notifications to it.

```javascript
cio.deleteDevice(1, "device_token");
```

#### Options

- **customer_id**: String (required)
- **device_token**: String (required)

### cio.suppress(id)

Suppress a customer.

```javascript
cio.suppress(1);
```

#### Options

- **customer_id**: String (required)

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
const { APIClient, SendEmailRequest } = require("customerio-node/api");
const { RegionUS, RegionEU } = require("customerio-node/regions");
let api = new APIClient("app-key", { region: RegionUS });

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

- **id**: String (required)
- **data**: Object (optional)
- **recipients**: Object (optional)

## Further examples

We've included functional examples in the [examples/ directory](https://github.com/customerio/customerio-node/tree/master/examples) of the repo to further assist in demonstrating how to use this library to integrate with Customer.io

## Tests

```bash
npm install && npm test
```

## License

Released under the MIT license. See file [LICENSE](LICENSE) for more details.
