# Track API (`TrackClient`)

Method reference for the Track API client. See the [README](../README.md) for installation and cross-cutting behavior (regions, retries, and promise handling).

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
If you need to suppress a person, please use [`cio.suppress`](#ciosuppressid).

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

### cio.batch(operations)

Send a batch of operations (identifies, events, etc.) to the [v2 batch endpoint](https://customer.io/docs/api/track/#operation/batch) in a single request. `operations` is an array of operation objects shaped per the API docs.

```javascript
cio.batch([
  {
    type: "person",
    action: "identify",
    identifiers: { id: "1" },
    attributes: { plan: "pro" },
  },
  {
    type: "person",
    action: "event",
    identifiers: { id: "1" },
    name: "signup",
  },
]);
```

#### Options

- **operations**: Array of operation objects (required, non-empty)

### cio.entity(operation)

Send a single self-describing operation to the [v2 entity endpoint](https://customer.io/docs/api/track/#operation/entity). This is the singular counterpart to `cio.batch` — `operation` is shaped like one element of a `batch` array.

```javascript
cio.entity({
  type: "person",
  action: "identify",
  identifiers: { id: "1" },
  attributes: { plan: "pro" },
});
```

#### Options

- **operation**: A single operation object (required, non-empty)

### cio.addCustomersToSegment(segmentId, customerIds, idType)

Add people to a manual segment.

```javascript
cio.addCustomersToSegment(7, ["1", "2"]);
cio.addCustomersToSegment(7, ["a@example.com"], IdentifierType.Email);
```

#### Options

- **segmentId**: The manual segment's id (required)
- **customerIds**: Array of 1–1000 identifiers, matching `idType` (required, non-empty)
- **idType**: One of `id`, `email`, or `cio_id` (optional; the API defaults to `id`)

### cio.removeCustomersFromSegment(segmentId, customerIds, idType)

Remove people from a manual segment. Same arguments as `addCustomersToSegment`.

```javascript
cio.removeCustomersFromSegment(7, ["1", "2"]);
```

### cio.submitForm(formId, data)

Submit a [form](https://customer.io/docs/api/track/#operation/submitForm) on behalf of a person. `data` holds the submitted form fields and must contain exactly one identifier (`email` or `id`) so the submission can be attributed to a person.

```javascript
cio.submitForm("signup", { email: "a@example.com", plan: "pro" });
```

#### Options

- **formId**: The form's id (required)
- **data**: The submitted form fields, including the identifier (required, non-empty)

### cio.reportMetric(data)

Report a delivery metric (open, click, bounce, etc.) for any channel to the [metrics endpoint](https://customer.io/docs/api/track/#operation/metrics). Unlike `cio.trackPush` (push only), this works for email, SMS, push, in-app, Slack, and webhook deliveries.

```javascript
cio.reportMetric({
  delivery_id: "RPILAgUBcRhIBqSfeiIwdIYJKxTY",
  metric: "opened",
  timestamp: 1613063089,
});
```

#### Options

- **data**: Metric payload. `delivery_id` is required; `metric`, `timestamp`, `recipient`, `reason`, and `href` are optional. Valid `metric` values depend on the delivery's channel.

### cio.getAccountRegion()

Look up the data region (US or EU) your account belongs to.

```javascript
cio.getAccountRegion();
```

### cio.unsubscribe(deliveryId, unsubscribe)

Custom [unsubscribe handling](https://customer.io/docs/api/track/#operation/unsubscribe) for a specific delivery. Sets (or clears) the recipient's `unsubscribed` attribute and attributes the change to the delivery.

```javascript
cio.unsubscribe("RPILAgUBcRhIBqSfeiIwdIYJKxTY");
cio.unsubscribe("RPILAgUBcRhIBqSfeiIwdIYJKxTY", false); // resubscribe
```

#### Options

- **deliveryId**: The `CIO-Delivery-ID` of the message (required)
- **unsubscribe**: `true` (default) to unsubscribe, `false` to resubscribe
