# Customerio [![CircleCI](https://circleci.com/gh/customerio/customerio-node.svg?style=svg)](https://circleci.com/gh/customerio/customerio-node)

A node client for the Customer.io [REST API](https://learn.customer.io/api/).

## Installation

```
npm i --save customerio-node
```

## Usage

### Creating a new instance

In order to start using the library, you first need to create an instance of the CIO class:

```
let CIO = require('customerio-node');
const cio = new CIO(siteId, apiKey, [defaults]);
```

Both the `siteId` and `apiKey` are **required** in order to create a Basic Authorization header, allowing us to associate the data with your account.

Optionally you may pass `defaults` as an object that will be passed to the underlying request instance. A list of the possible options are listed [here](https://github.com/request/request#requestoptions-callback).

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
  - _created\_at_ is a required key if you want to segment based on signed up/created date

---

### cio.destroy(id)

This will delete a person from Customer.io.

```
cio.destroy(1);
```

#### Options

* **id**: String (required)

---

### cio.track(id, data)

The track method will trigger events within Customer.io. When sending data along with your event, it is required to send a name key/value pair in you data object.

**Simple event tracking**

```
cio.track(1, { name: 'updated' });
```

**Sending data with an event**

```
cio.track(1, {
  name: 'purchase',
  data: {
    price: '23.45',
    product: 'socks'
  }
});
```

#### Options

* **id**: String (requiredl)
* **data**: Object (required)
  * _name_ is a required key on the Object
  * _data_ is an optional key for additional data sent over with the event

---

### cio.trackAnonymous(data)

Anonymous event tracking does not require a customer ID and these events will not be associated with a tracked profile in Customer.io

```
cio.trackAnonymous({
  name: 'updated',
  data: {
    updated: true,
    plan: 'free'
  }
});
```

#### Options

* **data**: Object (required)
  * _name_ is a required key on the Object
  * _data_ is an optional key for additional data sent over with the event

---

### cio.trackPageView(id, url)

Sending a page event includes sending over the customers id and the name of the page.

```
cio.trackPageView(1, '/home');
```

#### Options

* **id**: String (required)
* **url**: String (required)

### cio.triggerBroadcast(campaign_id, data, recipients)

Trigger an email broadcast using the email campaign's id. You can also optionally pass along custom data that will be merged with the liquid template, and additional conditions to filter recipients.

```
cio.triggerBroadcast(1, { name: 'foo'}, { segment: { id: 7 }});
```

You can also use emails or ids to select recipients, and pass optional API parameters such as `email_ignore_missing`.

```
cio.triggerBroadcast(1, { name: 'foo'},  { emails: ['example@emails.com'], email_ignore_missing: true }
);
```

[You can learn more about the recipient fields available here](https://customer.io/docs/api/#apicorecampaignscampaigns_trigger).

#### Options

* **id**: String (required)
* **data**: Object (optional)
* **recipients**: Object (optional)

### cio.addDevice(id, device_id, platform, data)
Add a device to send push notifications.

```
cio.addDevice(1, "device_id", "ios", { primary: true });
```

#### Options

* **customer_id**: String (required)
* **device_id**: String (required)
* **platform**: String (required)
* **data**: Object (optional)

### cio.deleteDevice(id, device_id)
Delete a device to remove it from the associated customer and stop sending push notifications to it.

```
cio.deleteDevice(1, "device_token")
```

#### Options

* **customer_id**: String (required)
* **device_token**: String (required)

### cio.addToSegment(id, customer_ids)
Add customers to a manual segment.

```
cio.addToSegment(1, ["1", "2", "3"])
```

#### Options

* **segment_id**: String (required)
* **customer_ids**: Array (required)

### cio.removeFromSegment(id, customer_ids)
Remove customers from a manual segment.

```
cio.removeFromSegment(1, ["1", "2", "3"])
```

#### Options

* **segment_id**: String (required)
* **customer_ids**: Array (required)

### cio.suppress(id)
Suppress a customer.

```
cio.suppress(1)
```

#### Options

* **customer_id**: String (required)

### Using Promises

All calls to the library will return a native promise, allowing you to chain calls as such:

```
const customerId = 1;

cio.identify(customerId, { first_name: 'Finn' }).then(() => {
  return cio.track(customerId, {
    name: 'updated',
    data: {
      updated: true,
      plan: 'free'
    }
  });
});
```

### Transactional API

To use the Customer.io [Transactional API](https://customer.io/docs/transactional-api), import our API client and initialise it with an [app key](https://customer.io/docs/managing-credentials#app-api-keys).

```
let CustomerioAPI = require('customerio-node/api');
const api = new CustomerioAPI(siteId, apiKey, [defaults]);
```

Then, you can pass in the `transactional_message_id`, the `to` (email) you want to send to, a `customer_id`, and any `message_data` that you want. [Learn more about how transactional messages work here](https://customer.io/docs/transactional-api).

```
api.sendEmail({
  to: 'ami@customer.io',
  transactional_message_id: 1,
  customer_id: 'c1',
  message_data: {
    token: "abc123",
    …
  }
})
```

`sendEmail` returns a promise that, if successful, will return an object containing the delivery ID.

## Further examples

We've included functional examples in the [examples/ directory](https://github.com/customerio/customerio-node/tree/master/examples) of the repo to further assist in demonstrating how to use this library to integrate with Customer.io

## Tests

```
npm install && npm test
```

## License

Released under the MIT license. See file [LICENSE](LICENSE) for more details.
