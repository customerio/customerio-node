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

### Quick start

Create a client with your secret key (`ak_…`). It sends tracking calls to the Track API and transactional messages to the App API, and picks the US or EU region from the key.

```javascript
const { CustomerIO } = require("customerio-node");
const cio = new CustomerIO({ apiKey: process.env.CIO_API_KEY });

await cio.identify("user_123", { email: "a@example.com" });
await cio.track("user_123", { name: "order_completed" });
await cio.sendEmail({
  to: "a@example.com",
  identifiers: { id: "user_123" },
  transactional_message_id: 5,
});
```

Pass `region` to override the region in the key. Legacy App API keys also work here; they default to `RegionUS` unless you pass `region`.

`identify`, `track`, `trackAnonymous`, `trackPageView` and the `send*` methods are on the client directly. The rest of the Track and App API are on `cio.trackClient` and `cio.apiClient`.

If the key can't do what you asked, the call throws a `KeyCapabilityError`. A public key (`wk_…`) throws it before any request when you send a transactional message. A 401 or 403 from the server is rethrown as a `KeyCapabilityError` too, with the original error on `cause`.

```javascript
const { KeyCapabilityError } = require("customerio-node");

try {
  await cio.sendEmail(request);
} catch (err) {
  if (err instanceof KeyCapabilityError) {
    console.error(err.capability, err.message); // "transactional", "This key can't send transactional messages ..."
  }
}
```

### Creating a TrackClient instance

The `TrackClient` and `APIClient` constructors below still work as before.

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

Method-level documentation lives in the [`docs/`](https://github.com/customerio/customerio-node/tree/main/docs) folder:

- [Track API](./docs/track.md) — `TrackClient`
- [App API](./docs/app.md) — `APIClient`
- [Pipelines (CDP) API](./docs/pipelines.md) — `PipelinesClient`
- [Webhooks](./docs/webhooks.md) — `verifyRequestSignature`

The full generated TypeScript API reference can be produced with `npm run docs` (Typedoc).

## Further examples

We've included functional examples in the [examples/ directory](https://github.com/customerio/customerio-node/tree/main/examples) of the repo to further assist in demonstrating how to use this library to integrate with Customer.io

## Tests

```bash
npm install && npm test
```

## License

Released under the MIT license. See file [LICENSE](LICENSE) for more details.
