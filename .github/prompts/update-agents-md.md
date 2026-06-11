# Update AGENTS.md

You are regenerating `AGENTS.md` at the root of the `customerio-node` repository. This file is the canonical agent-friendly description of this SDK. It is read by LLM-based coding assistants and routing layers that need to pick the right Customer.io SDK for a given task. Optimize for an LLM to ingest in a single read.

## What you must do

1. Inspect the current state of the SDK source. At minimum, read:
   - `package.json` (for the current version, name, and entry points)
   - `README.md` (for the canonical user-facing examples and any region/auth notes)
   - `index.ts` and the `lib/` directory (for the actual exported classes and methods)
   - `examples/` (for representative usage of the most-common methods)
2. Regenerate `AGENTS.md` at the repo root using the structure defined below. Replace the entire file. Do not append.
3. If the regenerated file is byte-identical to the existing one, do nothing. The workflow handles the no-op case via `git diff --quiet`.
4. Do not modify any file other than `AGENTS.md`.
5. Keep the file under 300 lines. Prefer compactness over completeness. If you must choose, drop sections in this order: extra examples, edge cases, then commentary. Never drop the structural sections listed below.

## Required structure

Use these section headings, in this exact order, as level-2 markdown headings:

```
# Customer.io Node.js SDK (AGENTS.md)

## What this is
## Install
## Initialize
## Common calls
## Auth and regions
## When to use this vs cdp-analytics-js
## Best for
## Links
```

### Section content rules

- **What this is**: One paragraph. Lead with: "Customer.io Node.js SDK for sending events, identifying users, and managing customer data via the Track API." Add one sentence on what the SDK wraps and one sentence on the typical caller (backend Node service authenticating with site id and API key).
- **Install**: Show the `npm install customerio-node` command. Include the current version pulled from `package.json` as a parenthetical: `npm install customerio-node` (current version: `X.Y.Z`). If `package.json` is missing for any reason, omit the version rather than guess.
- **Initialize**: Two fenced code blocks, one TypeScript and one JavaScript. Show importing the client, constructing it with site id and API key, and selecting a region. Mirror the patterns already in `README.md` or `examples/`. Do not invent new constructor shapes.
- **Common calls**: Pick the 5 to 7 most-used methods on the exported client by inspecting `lib/` and `examples/`. Likely candidates: `identify`, `track`, `trackAnonymous`, `destroy`, `addDevice`, `deleteDevice`, `mergeCustomers`, plus any transactional API helper such as `sendEmail` if it exists in this SDK. For each method, give a one-line purpose and a minimal code snippet (3 to 6 lines). Do not list every method on the client. Pick the high-traffic ones.
- **Auth and regions**: One short paragraph each on:
  - Site id and API key: explain that these are Track API credentials, where they live in the Customer.io UI (Account Settings, API Credentials, Track API Keys), and that they are workspace-scoped.
  - Region: US vs EU. Mention the region selector in the constructor and the default. Do not guess; read it from `lib/regions.ts`.
- **When to use this vs cdp-analytics-js**: Two to four lines. Server-side use this SDK; it talks to the Track API. Client-side or pipelines-style ingestion goes through `cdp-analytics-js`, which targets the Pipelines API. Make the contrast crisp so a routing agent can choose without reading either README.
- **Best for**: One line. "Backend Node services, serverless platforms like Vercel and AWS Lambda, and Express, Fastify, or Nest apps."
- **Links**: Bulleted list. Include:
  - Canonical API docs: https://docs.customer.io/api/
  - Track API guide: https://docs.customer.io/integrations/api/track/
  - This repository: https://github.com/customerio/customerio-node
  - npm package: https://www.npmjs.com/package/customerio-node

## Style rules

- No em dashes. Use hyphens, commas, periods, or rewrite. This applies to every line.
- No filler phrases ("It is worth noting", "Let's dive in"). State the thing.
- Active voice. Short paragraphs.
- Code blocks must be valid and import the right symbols. Do not invent method names. If you are unsure whether a method exists, omit it.
- Do not include a changelog, contributing guide, or test instructions. Those live elsewhere.
- Do not include AI authorship attribution anywhere.

## Output

Write the final document to `AGENTS.md` at the repository root. The workflow will diff and commit. If nothing changed, exit cleanly without writing.
