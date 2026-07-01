<p align=center>
  <a href="https://customer.io">
    <img src="https://avatars.githubusercontent.com/u/1152079?s=200&v=4" height="60">
  </a>
</p>

[![Gitpod Ready-to-Code](https://img.shields.io/badge/Gitpod-Ready--to--Code-blueviolet?logo=gitpod)](https://gitpod.io/#https://github.com/customerio/customerio-node/)
[![ci](https://github.com/customerio/customerio-node/actions/workflows/main.yml/badge.svg)](https://github.com/customerio/customerio-node/actions/workflows/main.yml)

# Customer.io NodeJS

A node client for the Customer.io Journeys [REST API](https://customer.io/docs/api/). If you're new to Customer.io, we recommend that you integrate with our [Data Pipelines JavaScript client](https://github.com/customerio/cdp-analytics-js) instead.

## Supported Node.js versions

This project is developed for and tested against the versions of Node.js that the Node.js project itself supports — the **Current** release plus the **Active LTS** and **Maintenance LTS** lines. See the [Node.js release schedule](https://nodejs.org/en/about/previous-releases) for details. When a Node.js version reaches end-of-life, support for it is dropped in the next release of this library, which may be a breaking change.

The `engines` field in `package.json` reflects the current minimum supported version.

## Alternative Node runtimes

As of v5.0.0 the SDK is built on top of standard `fetch`, so it runs on any runtime that implements the [WHATWG fetch standard](https://fetch.spec.whatwg.org/).

[Bun](https://bun.sh/) is exercised in CI alongside Node.js, so the supported matrix is:

- Node.js (Current, Active LTS, Maintenance LTS; see [Supported Node.js versions](#supported-nodejs-versions) above)
- Bun (latest)

Other fetch-compatible runtimes (Deno, Cloudflare Workers, etc.) should work but are not part of our test matrix. If you hit a runtime-specific issue, please open one against the [issue tracker](https://github.com/customerio/customerio-node/issues).

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

#### Retries

Requests that fail with a transient error are retried automatically with exponential backoff and jitter. This applies to every client (`TrackClient`, `APIClient`, and `PipelinesClient`). Transient failures are network errors (connection reset/refused, DNS, timeout) and the retryable HTTP status codes `408`, `429`, `500`, `502`, `503`, `504`, `522`, and `524`. A `Retry-After` response header is honored when present. Other 4xx responses (e.g. `400`, `401`, `404`, `422`) are returned immediately without retrying.

Retries are safe to replay: each call builds its payload once and the exact same request body is reused for every attempt.

Pass a `retry` object to tune or disable the policy. Any fields you omit fall back to the defaults shown below:

```
const cio = new TrackClient('123', 'abc', {
  retry: {
    maxRetries: 3, // set to 0 to disable retries entirely
    minTimeoutMs: 200,
    maxTimeoutMs: 5000,
    retryStatusCodes: [408, 429, 500, 502, 503, 504, 522, 524],
    respectRetryAfter: true,
    retryAfterMaxSeconds: 300,
    maxTotalBackoffMs: 30000,
  },
});
```

The backoff for attempt `n` (zero-based) is `min(maxTimeoutMs, (random() + 1) * minTimeoutMs * 2 ** n)`. The total time spent sleeping across all retries for a single call is capped at `maxTotalBackoffMs`; if the next backoff would exceed it, the last error is thrown instead.

---

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

---

## API reference

Method-level documentation for each client lives in the [`docs/`](./docs) folder:

- [Track API](./docs/track.md) — `TrackClient`
- [App API](./docs/app.md) — `APIClient`
- [Pipelines (CDP) API](./docs/pipelines.md) — `PipelinesClient`

The full generated TypeScript API reference can be produced with `npm run docs` (Typedoc).

---

## Webhooks

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

## Further examples

We've included functional examples in the [examples/ directory](https://github.com/customerio/customerio-node/tree/main/examples) of the repo to further assist in demonstrating how to use this library to integrate with Customer.io

## Tests

```bash
npm install && npm test
```

## License

Released under the MIT license. See file [LICENSE](LICENSE) for more details.
