# Pipelines (CDP) API (`PipelinesClient`)

Method reference for the Pipelines client. See the [README](../README.md) for installation and cross-cutting behavior (regions, retries, and promise handling).

The Pipelines API is Customer.io's ingestion endpoint for the Segment-compatible identify/track/page/screen/group/alias event model. It runs at a different host (`cdp.customer.io`) from the Track and App APIs and authenticates with a **Pipelines write key** (set up under _Data Pipelines → Sources_ in the dashboard).

> **Need client-side batching, buffered flushes, or retries?** Use [`@customerio/cdp-analytics-node`](https://www.npmjs.com/package/@customerio/cdp-analytics-node) instead. `PipelinesClient` in this package is a thin, stateless client that issues one HTTP request per call — same as `TrackClient` and `APIClient`.

### Creating a Pipelines client

```js
const { PipelinesClient, RegionUS, RegionEU } = require("customerio-node");

const pipelines = new PipelinesClient("YOUR_PIPELINES_WRITE_KEY", {
  region: RegionUS, // or RegionEU; defaults to RegionUS
});
```

**Constructor options** (second argument):

- `region`: `RegionUS` or `RegionEU`. Defaults to `RegionUS`.
- `url`: Override the region-derived host. Useful for testing against a proxy.
- `strictMode`: When `true`, sends `X-Strict-Mode: 1` on every request so the Pipelines API validates payloads and returns proper HTTP error codes instead of accepting malformed events silently.
- `defaultContext`: Default `context` values merged under every outgoing payload (per-call `context` always wins on key conflicts). Useful for setting things like `ip` or `locale` once per client instance.
- `timeout`: HTTP timeout in ms. Defaults to `10_000`.

### Field naming

Pipelines payloads use **camelCase** (`userId`, `anonymousId`, `groupId`, `previousId`, `messageId`) because that's what the API accepts on the wire. This differs from the rest of this SDK, which is snake_case to match the Track and App APIs.

### Auto-filled fields

Every payload is augmented before sending:

- `messageId`: A UUID v4, when not supplied.
- `timestamp`: The current time as an ISO-8601 string, when not supplied.
- `context.library`: `{ name: 'customerio-node', version }`, when not supplied.

Per-call values always win, so passing your own `messageId` (e.g. for idempotency) or `timestamp` (e.g. for backfilling) is supported.

### pipelines.identify(payload)

Add or update a person and their traits.

```js
pipelines.identify({
  userId: "1",
  traits: { email: "customer@example.com", plan: "pro" },
});
```

At least one of `userId` or `anonymousId` is required.

### pipelines.track(payload)

Record an event.

```js
pipelines.track({
  userId: "1",
  event: "Order Completed",
  properties: { price: 23.45, product: "socks" },
});
```

At least one of `userId` or `anonymousId` is required. `event` is required.

### pipelines.page(payload)

Log a page view.

```js
pipelines.page({
  userId: "1",
  name: "Pricing",
  properties: { path: "/pricing", referrer: "https://example.com" },
});
```

### pipelines.screen(payload)

Capture a mobile screen view from a server-side handler.

```js
pipelines.screen({
  userId: "1",
  name: "Settings",
});
```

### pipelines.group(payload)

Create an object/group and associate a person with it.

```js
pipelines.group({
  userId: "1",
  groupId: "acme-co",
  traits: { plan: "enterprise" },
});
```

`groupId` is required, along with at least one of `userId` or `anonymousId`.

### pipelines.alias(payload)

Merge profiles by reconciling identifiers.

```js
pipelines.alias({
  userId: "1",
  previousId: "anon-abc-123",
});
```

Both `userId` and `previousId` are required.

### pipelines.batch(items)

Submit up to 500 KB worth of identify/track/page/screen/group/alias events in a single request. Each item must include a `type` discriminator naming the endpoint it would otherwise have been sent to.

```js
pipelines.batch([
  { type: "identify", userId: "1", traits: { plan: "pro" } },
  { type: "track", userId: "1", event: "Subscribed", properties: { plan: "pro" } },
]);
```

Each item is enveloped (auto-filled `messageId`, `timestamp`, `context.library`) before sending.
