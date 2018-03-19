[![Build Status](https://travis-ci.org/customerio/customerio-node.svg)](https://travis-ci.org/customerio/customerio-node)

# Customerio

A node client for the Customer.io [REST API](https://learn.customer.io/api/).

## Installation

```
npm i customerio-node
```

## Usage

### Creating a new instance

In order to start using the library, you first need to create an instance of the CIO class:

```
const cio = new CIO(siteId, apiKey);
```

Both the `siteId` and `apiKey` are **required** in order to create a Basic Authorization header, allowing us to associate the data with your account.

---

### cio.identify(id, data)

Creating a person is as simple as identifying them with this call. You can also use this method to update a persons data.

```
cio.identify(1, {
  first_name: 'Finn',
  last_name: 'Mertens'
});
```

#### Options

* **id**: String (required)
* **data**: Object (optional)

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

The track method will trigger events within Customer.io. When sending data along with your event, it is required to send a name key/value pair in you data object. If you do not pass an id as the first parameter, it will be tracked as an anonymous event.

**Simple event tracking**

```
cio.track(1, { name: 'updated' });
```

**Sending data with an event**

```
cio.track(1, {
  name: 'updated',
  data: {
    updated: true,
    plan: 'free'
  }
});
```

**Tracking an anonymous event**

```
cio.track({
  name: 'updated',
  data: {
    updated: true,
    plan: 'free'
  }
});
```

#### Options

* **id**: String (optional)
* **data**: Object (optional)
  * _name_ is a required key on the Object
  * _data_ is a required key if additional data is to be sent over with the event

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
cio.triggerBroadcast(1, { name: 'foo'}, { segment: { id: 7 });
```

#### Options

* **id**: String (required)
* **data**: Object (optional)
* **recipients**: Object (optional)

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

## Tests

```
npm install && npm test
```

## License

Released under the MIT license. See file called LICENSE for more details.
