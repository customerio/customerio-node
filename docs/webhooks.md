# Webhooks

Reference for verifying inbound Customer.io reporting webhooks. See the [README](../README.md) for installation.

### verifyRequestSignature(options)

Verify that an incoming [reporting webhook](https://docs.customer.io/api/webhooks/) request genuinely came from Customer.io. Customer.io signs each request with an HMAC-SHA256 over `v0:<timestamp>:<body>` and sends the hex-encoded result in the `X-CIO-Signature` header, along with the `X-CIO-Timestamp` header. This helper recomputes the signature from your signing secret and compares it in constant time.

```javascript
const { verifyRequestSignature } = require("customerio-node");

// e.g. inside an Express handler using a raw-body parser
const valid = verifyRequestSignature({
  signingSecret: process.env.CIO_WEBHOOK_SECRET,
  timestamp: req.headers["x-cio-timestamp"],
  signature: req.headers["x-cio-signature"],
  body: req.rawBody, // the raw, unparsed request body
});

if (!valid) {
  res.status(400).send("invalid signature");
  return;
}
```

#### Options

- **signingSecret**: Your webhook signing secret, from the webhook's settings page in Customer.io. Required; throws `MissingParamError` if empty.
- **timestamp**: The `X-CIO-Timestamp` header value.
- **signature**: The `X-CIO-Signature` header value.
- **body**: The raw request body as a `string` or `Buffer`. Use the exact bytes received — do not re-serialize with `JSON.stringify`, as formatting differences will change the hash.

Returns `true` when the signature is valid and `false` otherwise (including for a missing or malformed signature).
