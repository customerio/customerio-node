# Live integration tests

These suites run the SDK against a **real Customer.io workspace**. They are not
part of `npm test` and never run in CI. Use them as the pre-release sanity sweep
or to smoke-test a branch against your own account.

> Point them at a throwaway/personal test workspace, never production. The
> suites create profiles, fire events, send messages, and (in `live.ts`) delete
> and merge profiles.

## Suites

| File         | Covers                                                                                                                                                | Extra credential                            |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `live.ts`    | `TrackClient` + `APIClient` (identify, track, devices, batch, sends, exports, suppress, merge, destroy)                                               | `CIO_SITE_ID`, `CIO_API_KEY`, `CIO_APP_KEY` |
| `v5-live.ts` | v5.0.0 additions: full `PipelinesClient` surface (identify/track/page/screen/group/alias/batch) + the `ResponseLike` error shape and non-retry of 4xx | `CIO_PIPELINES_WRITE_KEY`                   |

## Setup

1. Copy the env template and fill in your test-workspace credentials:

   ```bash
   cp test/integration/live.env.example test/integration/live.env
   $EDITOR test/integration/live.env
   ```

   Where to find each key in the dashboard:
   - `CIO_SITE_ID` / `CIO_API_KEY`: Settings → API Credentials → **Tracking API Keys**
   - `CIO_APP_KEY`: Settings → API Credentials → **App API Keys** (bearer token)
   - `CIO_PIPELINES_WRITE_KEY`: Data Pipelines → **Sources** → your source

2. Load the env and run a suite:

   ```bash
   set -a && source test/integration/live.env && set +a

   npm run test:live           # Track + App API suite (live.ts)
   npm run test:live:v5        # v5.0.0 additions (v5-live.ts)
   npm run test:live:all       # both
   ```

## Graceful skipping

Everything is env-gated, so a partial setup just skips what it can't run:

- No `CIO_LIVE=1` → the whole suite reports a single skipped placeholder.
- `live.ts` send/broadcast/export tests skip unless their `CIO_TEST_*` message
  IDs are set (those need objects that exist in your workspace).
- `v5-live.ts` Pipelines tests skip unless `CIO_PIPELINES_WRITE_KEY` is set. The
  error-shape tests only need `CIO_LIVE=1` (they hit the live host with a
  deliberately invalid key to assert the 401 path).

So the minimum useful run for the v5 work is: a `CIO_PIPELINES_WRITE_KEY` from a
Data Pipelines source on your test account, plus `CIO_LIVE=1`.
