import test from 'ava';
import sinon from 'sinon';
import { PipelinesClient } from '../lib/pipelines';
import { CustomerIORequestError } from '../lib/utils';

const response = { statusCode: 400, headers: {}, ok: false };

// Sends one track call through a PipelinesClient whose fetch answers `status`
// with `body`, and returns the error it rejects with plus the number of
// attempts. The Pipelines API sends its JSON errors as text/plain today.
async function pipelinesError(status: number, body: string) {
  const fetchStub = sinon
    .stub(global, 'fetch')
    .callsFake(async () => new Response(body || null, { status, headers: { 'content-type': 'text/plain' } }));
  try {
    const client = new PipelinesClient('wk-abc-123', { strictMode: true });
    sinon.stub(client.request, 'sleep').resolves();

    const error = await client.track({ userId: '1', event: 'Signed Up' }).catch((err: unknown) => err);

    return { error: error as CustomerIORequestError, attempts: fetchStub.callCount };
  } finally {
    fetchStub.restore();
  }
}

// -----------------------------------------------------------------------------
// Pipelines API error bodies
// -----------------------------------------------------------------------------

test.serial('a strict-mode 401 shows the field and message', async (t) => {
  const { error, attempts } = await pipelinesError(
    401,
    '{"errors":[{"reason":"invalid","field":"authorization","message":"must provide valid credentials"}]}',
  );

  t.true(error instanceof CustomerIORequestError);
  t.is(error.message, 'authorization: must provide valid credentials');
  t.is(error.statusCode, 401);
  t.is(attempts, 1);
});

test.serial('a strict-mode 400 shows the field and message', async (t) => {
  const { error, attempts } = await pipelinesError(
    400,
    '{"errors":[{"reason":"invalid","field":"body","message":"request too large, must be smaller than 32kb"}]}',
  );

  t.is(error.message, 'body: request too large, must be smaller than 32kb');
  t.is(attempts, 1);
});

test.serial('a strict-mode batch 400 lists every error with its batch index', async (t) => {
  const body = JSON.stringify({
    errors: [
      { index: 0, reason: 'required', field: 'event', message: 'must provide value for required field' },
      { index: 2, reason: 'required', field: 'userId', message: 'must provide userId or anonymousId' },
    ],
  });
  const { error } = await pipelinesError(400, body);

  t.is(
    error.message,
    `2 errors:
  - batch[0].event: must provide value for required field
  - batch[2].userId: must provide userId or anonymousId`,
  );
});

test.serial('a 500 with code and message shows both, and is still retried', async (t) => {
  const { error, attempts } = await pipelinesError(
    500,
    '{"success":false,"code":"internal_error","message":"The request failed. Retry it."}',
  );

  t.is(error.message, 'internal_error: The request failed. Retry it.');
  t.is(error.statusCode, 500);
  t.is(attempts, 4);
});

test.serial('a Segment-style 400 shows code and message', async (t) => {
  const { error } = await pipelinesError(
    400,
    '{"success":false,"code":"invalid_request","message":"Exceed payload limit"}',
  );

  t.is(error.message, 'invalid_request: Exceed payload limit');
});

test.serial('a 500 with only {"success":false} shows the status, and is still retried', async (t) => {
  const { error, attempts } = await pipelinesError(500, '{"success":false}');

  t.is(error.message, 'Request failed with status 500');
  t.is(attempts, 4);
});

test.serial('a 500 with an empty body shows the status, and is still retried', async (t) => {
  const { error, attempts } = await pipelinesError(500, '');

  t.is(error.message, 'Request failed with status 500');
  t.is(error.body, '');
  t.is(attempts, 4);
});

test('a plain-text body is used as the message', (t) => {
  const error = new CustomerIORequestError(null, 400, response, 'Error when parsing request\n');

  t.is(error.message, 'Error when parsing request');
});

test('composeMessage uses message or code when only one is present', (t) => {
  t.is(
    CustomerIORequestError.composeMessage({ success: false, message: 'Exceed payload limit' }),
    'Exceed payload limit',
  );
  t.is(CustomerIORequestError.composeMessage({ success: false, code: 'internal_error' }), 'internal_error');
});

test('composeMessage prefers message over errors[]', (t) => {
  const json = {
    success: false,
    code: 'invalid_request',
    message: 'event: must provide value for required field',
    errors: [{ reason: 'required', field: 'event', message: 'must provide value for required field' }],
  };

  t.is(CustomerIORequestError.composeMessage(json), 'invalid_request: event: must provide value for required field');
});

test('composeMessage formats errors[] items with and without field or index', (t) => {
  const compose = (error: Record<string, unknown>) => CustomerIORequestError.composeMessage({ errors: [error] });

  t.is(compose({ index: 3, field: 'type', message: 'is invalid' }), 'batch[3].type: is invalid');
  t.is(compose({ index: 0, field: '', message: 'is invalid' }), 'batch[0]: is invalid');
  t.is(compose({ reason: 'invalid', field: 'type', message: 'is invalid' }), 'type: is invalid');
  t.is(compose({ reason: 'invalid', field: '', message: 'is invalid' }), 'is invalid');
});

test('composeMessage skips errors[] items without a message', (t) => {
  const json = {
    errors: [null, 'oops', { reason: 'invalid', field: 'type' }, { field: 'event', message: 'is required' }],
  };

  t.is(CustomerIORequestError.composeMessage(json), 'event: is required');
  t.is(
    CustomerIORequestError.composeMessage({ errors: [{ reason: 'invalid' }] }, '', 400),
    'Request failed with status 400',
  );
});

test('composeMessage falls back to the status, then to "Unknown error"', (t) => {
  t.is(CustomerIORequestError.composeMessage(null, 'null', 502), 'Request failed with status 502');
  t.is(CustomerIORequestError.composeMessage({}, '  ', 503), 'Request failed with status 503');
  t.is(CustomerIORequestError.composeMessage({}, '{}', 0), 'Unknown error');
  t.is(CustomerIORequestError.composeMessage(null), 'Unknown error');
  t.is(CustomerIORequestError.composeMessage({}), 'Unknown error');
});

// -----------------------------------------------------------------------------
// Track and App API error bodies keep their existing messages
// -----------------------------------------------------------------------------

const existingFormats: Array<[string, Record<string, any>, string]> = [
  ['Track meta.error', { meta: { error: 'invalid customer id' } }, 'invalid customer id'],
  ['Track meta.errors with one error', { meta: { errors: ['bad id'] } }, '1 error:\n  - bad id'],
  [
    'Track meta.errors with two errors',
    { meta: { errors: ['bad id', 'bad email'] } },
    '2 errors:\n  - bad id\n  - bad email',
  ],
  ['App errors[].detail', { errors: [{ detail: 'unauthorized', status: '401' }] }, 'unauthorized'],
  [
    'meta.error over a top-level message',
    { meta: { error: 'invalid customer id' }, message: 'other' },
    'invalid customer id',
  ],
  [
    'App detail over Pipelines fields',
    { errors: [{ detail: 'unauthorized', field: 'x', message: 'y' }] },
    'unauthorized',
  ],
];

for (const [name, json, expected] of existingFormats) {
  test(`existing format unchanged: ${name}`, (t) => {
    t.is(CustomerIORequestError.composeMessage(json), expected);
    t.is(new CustomerIORequestError(json, 400, response, JSON.stringify(json)).message, expected);
  });
}
