# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm test` — runs `nyc ava` (TypeScript tests via ts-node) with coverage. The `nyc` config in `package.json` enforces **100% branch/line/function/statement coverage** — coverage gaps fail the build.
- `npm run build` — `tsc -p tsconfig.json`, emits to `dist/` (the published artifact; `package.json#main` points there).
- Run a single test file: `npx ava test/track.ts`. Single test by title: `npx ava test/track.ts -m "constructor sets necessary variables"`.
- `npm run version` — regenerates `lib/version.ts` from `package.json#version`. Always run this (or update by hand) when bumping the version; the husky `pre-commit` hook runs `check-version.ts` and **fails the commit** if `lib/version.ts` and `package.json` disagree. The `User-Agent` header sent on every request reads from `lib/version.ts`.
- The pre-commit hook also runs `pretty-quick --staged` (Prettier on staged files; config in `.prettierrc.js` — 120-col, single-quote, trailing-comma all).
- CI (`.github/workflows/main.yml`) runs `npm test` against Node 14, 15, 16, 17, 18 — keep changes compatible with Node 14+.

## Architecture

Two top-level clients wrap two distinct Customer.io APIs, each with its own auth scheme and base URL. Both share one `Request` transport.

- **`TrackClient`** ([lib/track.ts](lib/track.ts)) — Track API. Auth: HTTP Basic from `(siteId, apiKey)`. Base URL: `Region.trackUrl`. Identify, track events, devices, suppress, merge customers.
- **`APIClient`** ([lib/api.ts](lib/api.ts)) — App/Transactional API. Auth: Bearer `appKey`. Base URL: `Region.apiUrl`. Transactional sends, broadcasts, exports, attribute lookups.

`Region` ([lib/regions.ts](lib/regions.ts)) bundles both URLs together — `RegionUS` and `RegionEU` are the two exported instances. Construction validates `region instanceof Region` (so plain objects are rejected). Override `defaults.url` to point at a custom host (used in tests).

`Request` ([lib/request.ts](lib/request.ts)) is the single HTTP layer for both clients. It uses **only the Node built-in `https` module** — no axios, fetch, or other HTTP dependency. Behavior worth knowing before touching it:

- Auth header is computed once in the constructor based on whether `auth` is `BasicAuth` (object) or `BearerAuth` (string).
- Default timeout 10s, overridable via `defaults` passed to the client constructor.
- `handler` follows 301/302/307/308 redirects by recursing on `Location`.
- Only 200 and 201 resolve; everything else rejects with `CustomerIORequestError` carrying `statusCode`, `response` (`IncomingMessage`), and raw `body`. `composeMessage` extracts `meta.error` / `meta.errors` from the JSON body.

### Transactional request objects

`api.sendEmail / sendPush / sendSMS / sendInboxMessage / sendInApp` each take a **specific request class instance** from [lib/api/requests.ts](lib/api/requests.ts) and use `instanceof` to validate — passing a plain object intentionally throws. This is by design; do not loosen the check. `SendEmailRequest` additionally exposes `attach(name, data, { encode })` which base64-encodes by default.

### `triggerBroadcast` recipient-shape rule

`APIClient.triggerBroadcast` ([lib/api.ts](lib/api.ts)) inspects the `recipients` arg for one of the "custom" recipient fields (`ids`, `emails`, `per_user_data`, `data_file_url`); when one is present, it whitelists only the fields allowed for that key (per `BROADCASTS_ALLOWED_RECIPIENT_FIELDS`) and sends them flat alongside `data`. Otherwise it falls through and sends the full `recipients` object nested under `recipients`. Keep the whitelist in sync with the API docs if adding fields.

### Public surface

[index.ts](index.ts) is the package entry — only what's re-exported there is public API. Anything not re-exported (e.g. internal utils, `Request`) is implementation detail. `IdentifierType` and `CustomerIORequestError` are exported by name; everything else flows through `export *`.

## Conventions specific to this repo

- TypeScript is strict (`tsconfig.json`: `strict`, `noImplicitAny`, `strictNullChecks`, `noUnusedParameters`). The build sets `noEmitOnError: true`, so type errors block `dist/` output.
- Tests use **ava + sinon + nyc**, written in TypeScript and executed via `ts-node/register` (configured in `package.json#ava`). Mirror existing patterns: `sinon.stub` `Request.prototype` methods rather than hitting the network.
- New code paths must come with tests — the 100% coverage gate will reject untested branches.
- Customer-id values flowing into URL paths are `encodeURIComponent`-ed (see `track.ts`); preserve this when adding new endpoints that take ids in the path.
- `isEmpty` / `MissingParamError` ([lib/utils.ts](lib/utils.ts)) is the standard required-param check — use it for new methods rather than ad-hoc validation.
