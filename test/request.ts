import type { TestFn } from 'ava';
import avaTest from 'ava';
import type { SinonStub } from 'sinon';
import sinon from 'sinon';
import { resolve } from 'path';
import fs from 'fs';
import Request from '../lib/request';

type TestContext = { req: Request; fetchStub: sinon.SinonStub };

const test = avaTest as TestFn<TestContext>;

// setup & fixture data
const siteid = '123';
const apikey = 'abc';
const appKey = 'abc';
const uri = 'https://track.customer.io/api/v1/customers/1';
const data = { first_name: 'Bruce', last_name: 'Wayne' };
const trackAuth = `Basic ${Buffer.from(`${siteid}:${apikey}`).toString('base64')}`;
const appAuth = `Bearer ${appKey}`;
const PACKAGE_VERSION = JSON.parse(fs.readFileSync(resolve(__dirname, '..', 'package.json')).toString()).version;
const baseOptions = {
  uri,
  headers: {
    Authorization: trackAuth,
    'Content-Type': 'application/json',
    'User-Agent': `Customer.io Node Client/${PACKAGE_VERSION}`,
  },
};
const putOptions = Object.assign({}, baseOptions, {
  method: 'PUT',
  body: JSON.stringify(data),
  headers: {
    ...baseOptions.headers,
    'Content-Length': JSON.stringify(data).length,
  },
});

// Build a Response-like object that exposes only the surface the request
// handler reads (status, ok, headers, text). Using a plain object (rather than
// the global Response constructor) lets us use status: 0 and other shapes the
// Response constructor would reject.
const makeMockResponse = (statusCode: number | null, body: string, headers: Record<string, string>) => {
  const status = statusCode ?? 0;
  return {
    status,
    ok: status >= 200 && status < 300,
    headers: new Headers(headers),
    text: async () => body,
  } as unknown as Response;
};

const createMockRequest = (
  fetchStub: SinonStub,
  statusCode: number | null,
  body: Record<string, any> | string | null = '',
  error?: Error,
  headers: Record<string, string> = {},
): SinonStub => {
  if (error) {
    fetchStub.rejects(error);
    return fetchStub;
  }

  const responseBody = typeof body === 'object' ? JSON.stringify(body) : body;
  fetchStub.resolves(makeMockResponse(statusCode, responseBody, headers));

  return fetchStub;
};

test.beforeEach((t) => {
  t.context.fetchStub = sinon.stub(global, 'fetch');
  t.context.req = new Request({ siteid: '123', apikey: 'abc' }, { timeout: 5000 });
});

test.afterEach((t) => {
  t.context.fetchStub.restore();
});

// tests begin here
test.serial('constructor sets all properties correctly for track api', (t) => {
  t.is(t.context.req.siteid, '123');
  t.is(t.context.req.apikey, 'abc');
  t.deepEqual(t.context.req.defaults, { timeout: 5000 });
  t.is(t.context.req.auth, trackAuth);
});

test.serial('constructor sets default timeout correctly for track api', (t) => {
  const req = new Request({ siteid, apikey });
  t.deepEqual(req.defaults, { timeout: 10000 });
});

test.serial('constructor sets all properties correctly for app api', (t) => {
  const req = new Request(appKey, { timeout: 5000 });
  t.is(req.appKey, appKey);
  t.deepEqual(req.defaults, { timeout: 5000 });
  t.is(req.auth, appAuth);
});

test.serial('constructor sets default timeout correctly for app api', (t) => {
  const req = new Request(appKey);
  t.deepEqual(req.defaults, { timeout: 10000 });
});

test.serial('#options returns a correctly formatted object', (t) => {
  const expectedOptions = Object.assign({}, baseOptions, { method: 'POST', body: null });
  const resultOptions = t.context.req.options(uri, 'POST');

  t.deepEqual(resultOptions, expectedOptions);
});

test.serial('#options sets Content-Length using body length in bytes', (t) => {
  const body = { first_name: 'Wïly Wönka' };
  const method = 'POST';
  const expectedOptions = {
    ...baseOptions,
    method,
    headers: {
      ...baseOptions.headers,
      'Content-Length': 29,
    },
    body: JSON.stringify(body),
  };
  const resultOptions = t.context.req.options(uri, method, body);

  t.deepEqual(resultOptions, expectedOptions);
});

test.serial('#options merges custom headers from defaults.headers', (t) => {
  const req = new Request({ siteid, apikey }, { timeout: 5000, headers: { 'X-Strict-Mode': '1' } });
  const result = req.options(uri, 'POST');

  t.is((result.headers as Record<string, string>)['X-Strict-Mode'], '1');
  // Standard headers must still be present and correct.
  t.is((result.headers as Record<string, string>).Authorization, trackAuth);
  t.is((result.headers as Record<string, string>)['Content-Type'], 'application/json');
});

test.serial('#options does not allow defaults.headers to clobber the standard headers', (t) => {
  const req = new Request(
    { siteid, apikey },
    {
      timeout: 5000,
      headers: {
        Authorization: 'Basic should-be-ignored',
        'Content-Type': 'text/plain',
        'User-Agent': 'spoofed',
      },
    },
  );
  const result = req.options(uri, 'POST');

  t.is((result.headers as Record<string, string>).Authorization, trackAuth);
  t.is((result.headers as Record<string, string>)['Content-Type'], 'application/json');
  t.is((result.headers as Record<string, string>)['User-Agent'], `Customer.io Node Client/${PACKAGE_VERSION}`);
});

test.serial('#handler returns a promise', (t) => {
  createMockRequest(t.context.fetchStub, 200);
  const promise = t.context.req.handler(putOptions);
  t.is(promise.constructor.name, 'Promise');
});

test.serial('#handler makes a request and resolves a promise on success', async (t) => {
  const body = {};
  createMockRequest(t.context.fetchStub, 200, body);

  try {
    const res = await t.context.req.handler(putOptions);
    t.deepEqual(res, body);
  } catch {
    t.fail();
  }
});

test.serial('#handler makes a request and passes the uri and init correctly', async (t) => {
  const customOptions = {
    ...baseOptions,
    headers: {
      ...baseOptions.headers,
      'X-Test-Identifier': 'uri test',
    },
    uri: 'https://track.customer.io/api/v1/customers/1/events',
    body: JSON.stringify({ title: 'The Batman' }),
    method: 'POST',
  };

  const body = {};
  createMockRequest(t.context.fetchStub, 200, body);

  try {
    t.context.fetchStub.resetHistory();
    const res = await t.context.req.handler(customOptions);
    const call = t.context.fetchStub.getCall(0);
    t.is(call.args[0], customOptions.uri);
    const init = call.args[1] as RequestInit;
    t.is(init.method, 'POST');
    t.is(init.body, customOptions.body);
    t.deepEqual(init.headers as Record<string, unknown>, customOptions.headers);
    t.is((init as { redirect?: string }).redirect, 'manual');
    t.deepEqual(res, body);
  } catch {
    t.fail();
  }
});

test.serial('#handler makes a request and rejects with an error on failure', async (t) => {
  const customOptions = {
    ...baseOptions,
    ...{
      uri: 'https://track.customer.io/api/v1/customers/1/events',
      body: JSON.stringify({ title: 'The Batman' }),
      method: 'POST',
    },
  };

  const message = 'test error message';
  const body = { meta: { error: message } };
  createMockRequest(t.context.fetchStub, 400, body);

  try {
    await t.context.req.handler(customOptions);

    t.fail();
  } catch (err: any) {
    t.is(err.message, message);
  }
});

test.serial(
  '#handler makes a request and rejects with an error on failure that has an error array with multiple errors',
  async (t) => {
    const customOptions = {
      ...baseOptions,
      ...{
        uri: 'https://track.customer.io/api/v1/customers/1/events',
        body: JSON.stringify({ title: 'The Batman' }),
        method: 'POST',
      },
    };

    const messageOne = 'test error message one';
    const messageTwo = 'test error message two';
    const body = { meta: { errors: [messageOne, messageTwo] } };
    createMockRequest(t.context.fetchStub, 400, body);

    try {
      await t.context.req.handler(customOptions);

      t.fail();
    } catch (err: any) {
      t.is(
        err.message,
        `2 errors:
  - ${messageOne}
  - ${messageTwo}`,
      );
    }
  },
);

test.serial(
  '#handler makes a request and rejects with an error on failure that has an error array with one error',
  async (t) => {
    const customOptions = {
      ...baseOptions,
      ...{
        uri: 'https://track.customer.io/api/v1/customers/1/events',
        body: JSON.stringify({ title: 'The Batman' }),
        method: 'POST',
      },
    };

    const message = 'test error message';
    const body = { meta: { errors: [message] } };
    createMockRequest(t.context.fetchStub, 400, body);

    try {
      await t.context.req.handler(customOptions);

      t.fail();
    } catch (err: any) {
      t.is(
        err.message,
        `1 error:
  - ${message}`,
      );
    }
  },
);

test.serial(
  '#handler makes a request and rejects with an error on failure that has an unexpected structure',
  async (t) => {
    const customOptions = {
      ...baseOptions,
      ...{
        uri: 'https://track.customer.io/api/v1/customers/1/events',
        body: JSON.stringify({ title: 'The Batman' }),
        method: 'POST',
      },
    };

    const message = 'test error message';
    const body = { error: message };
    createMockRequest(t.context.fetchStub, 400, body);

    try {
      await t.context.req.handler(customOptions);

      t.fail();
    } catch (err: any) {
      t.is(err.message, 'Unknown error');
    }
  },
);

test.serial('#handler makes a request and rejects with an error on failure and has no status code', async (t) => {
  const customOptions = {
    ...baseOptions,
    ...{
      uri: 'https://track.customer.io/api/v1/customers/1/events',
      body: JSON.stringify({ title: 'The Batman' }),
      method: 'POST',
    },
  };

  const message = 'test error message';
  const body = { meta: { error: message } };
  createMockRequest(t.context.fetchStub, null, body);

  try {
    await t.context.req.handler(customOptions);

    t.fail();
  } catch (err: any) {
    t.is(err.statusCode, 0);
  }
});

test.serial('#handler makes a request and rejects with `null` as body', async (t) => {
  const customOptions = Object.assign({}, baseOptions, {
    uri: 'https://track.customer.io/api/v1/customers/1/events',
    body: JSON.stringify({ title: 'The Batman' }),
    method: 'POST',
  });

  createMockRequest(t.context.fetchStub, 500, null);

  try {
    await t.context.req.handler(customOptions);

    t.fail();
  } catch (err: any) {
    t.is(err.message, 'Unknown error');
  }
});

test.serial('#handler makes a request and rejects with a bad JSON response', async (t) => {
  const customOptions = Object.assign({}, baseOptions, {
    uri: 'https://track.customer.io/api/v1/customers/1/events',
    body: JSON.stringify({ title: 'The Batman' }),
    method: 'POST',
  });

  createMockRequest(t.context.fetchStub, 200, '<html></html>');

  try {
    await t.context.req.handler(customOptions);

    t.fail();
  } catch (err: any) {
    t.regex(err.message, /Unexpected token <|Unable to parse JSON/);
  }
});

test.serial('#handler makes a request and rejects with timeout error', async (t) => {
  const customOptions = Object.assign({}, baseOptions, {
    method: 'PUT',
    body: JSON.stringify(data),
    timeout: 1,
  });
  createMockRequest(t.context.fetchStub, 200, null, new Error('ETIMEDOUT'));

  try {
    await t.context.req.handler(customOptions);

    t.fail();
  } catch (err: any) {
    t.is(err.message, 'ETIMEDOUT');
  }
});

test.serial('#handler propagates the native TimeoutError when fetch is aborted by the timeout signal', async (t) => {
  const customOptions = Object.assign({}, baseOptions, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  const abortError = new DOMException('The operation was aborted due to timeout', 'TimeoutError');
  t.context.fetchStub.rejects(abortError);

  try {
    await t.context.req.handler(customOptions);
    t.fail('Expected handler to reject on timeout');
  } catch (err: any) {
    t.is(err.name, 'TimeoutError');
    t.is(err, abortError);
  }
});

test.serial('#handler propagates the native TypeError(`fetch failed`) with the underlying cause intact', async (t) => {
  const customOptions = Object.assign({}, baseOptions, {
    method: 'GET',
    body: null,
  });

  const cause = Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:443'), { code: 'ECONNREFUSED' });
  const wrapped = Object.assign(new TypeError('fetch failed'), { cause });
  t.context.fetchStub.rejects(wrapped);

  try {
    await t.context.req.handler(customOptions);
    t.fail('Expected handler to reject');
  } catch (err: any) {
    t.is(err, wrapped);
    t.is(err.message, 'fetch failed');
    t.is(err.cause, cause);
    t.is(err.cause.code, 'ECONNREFUSED');
  }
});

test.serial('#handler makes a request and follows redirects', async (t) => {
  const customOptions = Object.assign({}, baseOptions, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  const body = { redirected: true };

  t.context.fetchStub
    .onCall(0)
    .resolves(makeMockResponse(301, '', { location: 'https://track-eu.customer.io/api/v1/customers/1' }));
  t.context.fetchStub.onCall(1).resolves(makeMockResponse(200, JSON.stringify(body), {}));

  try {
    const res = await t.context.req.handler(customOptions);
    t.deepEqual(res, body);
    t.is(t.context.fetchStub.callCount, 2);
  } catch {
    t.fail();
  }
});

test.serial('#handler forwards the original request body across redirects', async (t) => {
  const originalBody = JSON.stringify(data);
  const customOptions = Object.assign({}, baseOptions, {
    method: 'PUT',
    body: originalBody,
  });

  t.context.fetchStub.onCall(0).resolves(
    makeMockResponse(301, 'redirect-response-body-not-a-payload', {
      location: 'https://track-eu.customer.io/api/v1/customers/1',
    }),
  );
  t.context.fetchStub.onCall(1).resolves(makeMockResponse(200, JSON.stringify({ ok: true }), {}));

  await t.context.req.handler(customOptions);

  const secondCallArgs = t.context.fetchStub.getCall(1).args[1] as RequestInit;
  t.is(secondCallArgs.body as string, originalBody);
});

test.serial('#handler strips the Authorization header on redirects to non-customer.io hosts', async (t) => {
  const customOptions = Object.assign({}, baseOptions, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  const body = { redirected: true };

  t.context.fetchStub
    .onCall(0)
    .resolves(makeMockResponse(301, '', { location: 'https://evil.example.com/api/v1/customers/1' }));
  t.context.fetchStub.onCall(1).resolves(makeMockResponse(200, JSON.stringify(body), {}));

  const res = await t.context.req.handler(customOptions);
  t.deepEqual(res, body);
  t.is(t.context.fetchStub.callCount, 2);

  const secondCallArgs = t.context.fetchStub.getCall(1).args[1] as RequestInit;
  const secondHeaders = secondCallArgs.headers as Record<string, string | undefined>;
  t.false('Authorization' in secondHeaders);
  t.is(secondHeaders.Authorization, undefined);
});

test.serial('#handler preserves the Authorization header on redirects within *.customer.io', async (t) => {
  const customOptions = Object.assign({}, baseOptions, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  const body = { redirected: true };

  t.context.fetchStub
    .onCall(0)
    .resolves(makeMockResponse(301, '', { location: 'https://track-eu.customer.io/api/v1/customers/1' }));
  t.context.fetchStub.onCall(1).resolves(makeMockResponse(200, JSON.stringify(body), {}));

  const res = await t.context.req.handler(customOptions);
  t.deepEqual(res, body);
  t.is(t.context.fetchStub.callCount, 2);

  const secondCallArgs = t.context.fetchStub.getCall(1).args[1] as RequestInit;
  const secondHeaders = secondCallArgs.headers as Record<string, string>;
  t.is(secondHeaders.Authorization, trackAuth);
});

test.serial('#handler preserves the Authorization header across 307 redirects', async (t) => {
  const customOptions = Object.assign({}, baseOptions, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  const body = { redirected: true };

  t.context.fetchStub
    .onCall(0)
    .resolves(makeMockResponse(307, '', { location: 'https://track-eu.customer.io/api/v1/customers/1' }));
  t.context.fetchStub.onCall(1).resolves(makeMockResponse(200, JSON.stringify(body), {}));

  const res = await t.context.req.handler(customOptions);
  t.deepEqual(res, body);
  t.is(t.context.fetchStub.callCount, 2);

  const secondCallArgs = t.context.fetchStub.getCall(1).args[1] as RequestInit;
  const secondHeaders = secondCallArgs.headers as Record<string, string>;
  t.is(secondHeaders.Authorization, trackAuth);
  t.is(secondCallArgs.body as string, customOptions.body);
});

test.serial('#handler preserves the Authorization header across 308 redirects', async (t) => {
  const customOptions = Object.assign({}, baseOptions, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  const body = { redirected: true };

  t.context.fetchStub
    .onCall(0)
    .resolves(makeMockResponse(308, '', { location: 'https://track-eu.customer.io/api/v1/customers/1' }));
  t.context.fetchStub.onCall(1).resolves(makeMockResponse(200, JSON.stringify(body), {}));

  const res = await t.context.req.handler(customOptions);
  t.deepEqual(res, body);
  t.is(t.context.fetchStub.callCount, 2);

  const secondCallArgs = t.context.fetchStub.getCall(1).args[1] as RequestInit;
  const secondHeaders = secondCallArgs.headers as Record<string, string>;
  t.is(secondHeaders.Authorization, trackAuth);
  t.is(secondCallArgs.body as string, customOptions.body);
});

test.serial('#handler propagates DNS failures with err.cause.code === ENOTFOUND intact', async (t) => {
  const customOptions = Object.assign({}, baseOptions, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  const cause = Object.assign(new Error('getaddrinfo ENOTFOUND track.customer.io'), { code: 'ENOTFOUND' });
  const wrapped = Object.assign(new TypeError('fetch failed'), { cause });
  t.context.fetchStub.rejects(wrapped);

  try {
    await t.context.req.handler(customOptions);
    t.fail('Expected handler to reject');
  } catch (err: any) {
    t.is(err, wrapped);
    t.is(err.cause, cause);
    t.is(err.cause.code, 'ENOTFOUND');
  }
});

test.serial('#handler makes a request and errors when redirecting without a location header', async (t) => {
  const customOptions = Object.assign({}, baseOptions, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  t.context.fetchStub.onCall(0).resolves(makeMockResponse(301, '', {}));

  try {
    await t.context.req.handler(customOptions);
    t.fail();
  } catch (err: any) {
    t.is(err.message, 'Received a 301 status, but no Location header was present');
  }
});

test.serial('#handler does not strip Authorization when the redirect Location is relative or malformed', async (t) => {
  const customOptions = Object.assign({}, baseOptions, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  t.context.fetchStub
    .onCall(0)
    .resolves(makeMockResponse(301, '', { location: 'https://track.customer.io/api/v1/customers/2' }));
  t.context.fetchStub.onCall(1).resolves(makeMockResponse(200, JSON.stringify({ ok: true }), {}));

  await t.context.req.handler(customOptions);

  const secondHeaders = (t.context.fetchStub.getCall(1).args[1] as RequestInit).headers as Record<string, string>;
  t.is(secondHeaders.Authorization, trackAuth);
});

test.serial('#get calls the handler, makes GET request with the correct args', (t) => {
  createMockRequest(t.context.fetchStub, 200);
  sinon.stub(t.context.req, 'handler');
  t.context.req.get(uri);
  t.truthy((t.context.req.handler as SinonStub).calledWith({ ...baseOptions, method: 'GET', body: null }));
});

test.serial('#get returns the promise generated by the handler', (t) => {
  createMockRequest(t.context.fetchStub, 200);
  const promise = t.context.req.get(uri);
  t.is(promise.constructor.name, 'Promise');
});

test.serial('#put calls the handler, makes PUT request with the correct args', (t) => {
  createMockRequest(t.context.fetchStub, 200);
  sinon.stub(t.context.req, 'handler');
  t.context.req.put(uri, data);
  t.truthy((t.context.req.handler as SinonStub).calledWith(putOptions));
});

test.serial('#put calls the handler, makes PUT request with default data', (t) => {
  createMockRequest(t.context.fetchStub, 200);
  sinon.stub(t.context.req, 'handler');
  t.context.req.put(uri);
  t.truthy(
    (t.context.req.handler as SinonStub).calledWith({
      ...putOptions,
      body: JSON.stringify({}),
      headers: {
        ...baseOptions.headers,
        'Content-Length': 2,
      },
    }),
  );
});

test.serial('#put returns the promise generated by the handler', (t) => {
  createMockRequest(t.context.fetchStub, 200);
  const promise = t.context.req.put(uri, data);
  t.is(promise.constructor.name, 'Promise');
});

const deleteOptions = Object.assign({}, baseOptions, { method: 'DELETE', body: null });

test.serial('#destroy calls the handler, makes a DELETE request with the correct args', (t) => {
  createMockRequest(t.context.fetchStub, 200);
  sinon.stub(t.context.req, 'handler');
  t.context.req.destroy(uri);
  t.truthy((t.context.req.handler as SinonStub).calledWith(deleteOptions));
});

test.serial('#destroy returns the promise generated by the handler', (t) => {
  createMockRequest(t.context.fetchStub, 200);
  const promise = t.context.req.destroy(uri);
  t.is(promise.constructor.name, 'Promise');
});

const postOptions = {
  ...baseOptions,
  method: 'POST',
  body: JSON.stringify(data),
  headers: {
    ...baseOptions.headers,
    'Content-Length': JSON.stringify(data).length,
  },
};

test.serial('#post calls the handler, makes a POST request with the correct args', (t) => {
  createMockRequest(t.context.fetchStub, 200);
  sinon.stub(t.context.req, 'handler');
  t.context.req.post(uri, data);
  t.truthy((t.context.req.handler as SinonStub).calledWith(postOptions));
});

test.serial('#handler resolves on 202 Accepted', async (t) => {
  const body = { status: 'queued' };
  createMockRequest(t.context.fetchStub, 202, body);

  try {
    const res = await t.context.req.handler(putOptions);
    t.deepEqual(res, body);
  } catch {
    t.fail();
  }
});

test.serial('#handler resolves on 204 No Content with empty body', async (t) => {
  createMockRequest(t.context.fetchStub, 204, '');

  try {
    const res = await t.context.req.handler(putOptions);
    t.deepEqual(res, {});
  } catch {
    t.fail();
  }
});

test.serial('#handler rejects on 300 status code', async (t) => {
  const body = { meta: { error: 'multiple choices' } };
  createMockRequest(t.context.fetchStub, 300, body);

  try {
    await t.context.req.handler(putOptions);
    t.fail();
  } catch (err: any) {
    t.is(err.statusCode, 300);
  }
});

test.serial('#post returns the promise generated by the handler', (t) => {
  createMockRequest(t.context.fetchStub, 200);
  const promise = t.context.req.post(uri);
  t.is(promise.constructor.name, 'Promise');
});
