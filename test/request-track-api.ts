import avaTest, { TestInterface } from 'ava';
import https from 'https';
import sinon, { SinonStub } from 'sinon';
import { PassThrough } from 'stream';
import { resolve } from 'path';
import fs from 'fs';
import Request from '../lib/request';

type TestContext = { req: Request; httpsReq: sinon.SinonStub };

const test = avaTest as TestInterface<TestContext>;

// setup & fixture data
const siteid = '123';
const apikey = 'abc';
const uri = 'https://track.customer.io/api/v1/customers/1';
const data = { first_name: 'Bruce', last_name: 'Wayne' };
const auth = `Basic ${Buffer.from(`${siteid}:${apikey}`).toString('base64')}`;
const PACKAGE_VERSION = JSON.parse(fs.readFileSync(resolve(__dirname, '..', 'package.json')).toString()).version;
const baseOptions = {
  uri,
  headers: {
    Authorization: auth,
    'Content-Type': 'application/json',
    'Content-Length': 0,
    'User-Agent': `Customer.io Node Client/${PACKAGE_VERSION}`,
  },
};
const putOptions = Object.assign({}, baseOptions, {
  method: 'PUT',
  body: JSON.stringify(data),
  headers: Object.assign({}, baseOptions.headers, {
    'Content-Length': JSON.stringify(data).length,
  }),
});

const createMockRequest = (
  httpsReq: SinonStub,
  statusCode: number | null,
  body: Record<string, any> | string | null = '',
  error?: Error,
): SinonStub => {
  const response = new PassThrough();
  const request = new PassThrough();

  // Don't start writing response until request has ended
  // Use `finish` here, because calling `.end()` on a `PassThrough` doesn't emit the `end` event
  // https://stackoverflow.com/questions/41155877/node-js-passthrough-stream-not-closing-properly
  request.on('finish', () => {
    // Cast to any because PassThrough doesn't have ClientResponse properties types
    (response as any).statusCode = statusCode;
    if (error) {
      request.destroy(error);
    } else {
      response.write(typeof body === 'object' ? JSON.stringify(body) : body);
      response.end();
    }
  });

  // Cast to any because PassThrough doesn't conform to ClientRequest
  httpsReq.callsArgWith(1, response).returns(request as any);

  return httpsReq;
};

test.before((t) => {
  t.context.httpsReq = sinon.stub(https, 'request');
});

test.beforeEach((t) => {
  t.context.req = new Request({ siteid: '123', apikey: 'abc' }, { timeout: 5000 });
});

test.after((t) => {
  t.context.httpsReq.restore();
});

// tests begin here
test('constructor sets all properties correctly', (t) => {
  t.is(t.context.req.siteid, '123');
  t.is(t.context.req.apikey, 'abc');
  t.deepEqual(t.context.req.defaults, { timeout: 5000 });
  t.is(t.context.req.auth, auth);
});

test('constructor sets default timeout correctly', (t) => {
  const req = new Request({ siteid, apikey });
  t.deepEqual(req.defaults, { timeout: 10000 });
});

test('#options returns a correctly formatted object', (t) => {
  const expectedOptions = Object.assign({}, baseOptions, { method: 'POST', body: null });
  const resultOptions = t.context.req.options(uri, 'POST');

  t.deepEqual(resultOptions, expectedOptions);
});

test('#options sets Content-Length using body length in bytes', (t) => {
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

test('#handler returns a promise', (t) => {
  createMockRequest(t.context.httpsReq, 200);
  const promise = t.context.req.handler(putOptions);
  t.is(promise.constructor.name, 'Promise');
});

test('#handler makes a request and resolves a promise on success', async (t) => {
  const body = {};
  createMockRequest(t.context.httpsReq, 200, body);

  try {
    const res = await t.context.req.handler(putOptions);
    t.deepEqual(res, body);
  } catch {
    t.fail();
  }
});

test('#handler makes a request and parses the uri correctly', async (t) => {
  const customOptions = {
    ...baseOptions,
    headers: {
      ...baseOptions.headers,
      // Add identifier so that this specific call to the sinon stub can be
      // traced. The stub is shared across all tests and tests run async, so
      // order is not guaranteed.
      'X-Test-Identifier': 'uri test',
    },
    uri: 'https://track.customer.io/api/v1/customers/1/events',
    body: JSON.stringify({ title: 'The Batman' }),
    method: 'POST',
  };

  const body = {};
  createMockRequest(t.context.httpsReq, 200, body);

  try {
    t.context.httpsReq.resetHistory();
    const res = await t.context.req.handler(customOptions);
    t.truthy(
      t.context.httpsReq.calledWith({
        hostname: 'track.customer.io',
        path: '/api/v1/customers/1/events',
        method: 'POST',
        headers: customOptions.headers,
        timeout: 5000,
      }),
    );
    t.deepEqual(res, body);
  } catch {
    t.fail();
  }
});

test('#handler makes a request and rejects with an error on failure', async (t) => {
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
  createMockRequest(t.context.httpsReq, 400, body);

  try {
    await t.context.req.handler(customOptions);

    t.fail();
  } catch (err: any) {
    t.is(err.message, message);
  }
});

test('#handler makes a request and rejects with an error on failure that has an error array with multiple errors', async (t) => {
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
  createMockRequest(t.context.httpsReq, 400, body);

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
});

test('#handler makes a request and rejects with an error on failure that has an error array with one error', async (t) => {
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
  createMockRequest(t.context.httpsReq, 400, body);

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
});

test('#handler makes a request and rejects with an error on failure that has an unexpected structure', async (t) => {
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
  createMockRequest(t.context.httpsReq, 400, body);

  try {
    await t.context.req.handler(customOptions);

    t.fail();
  } catch (err: any) {
    t.is(err.message, 'Unknown error');
  }
});

test('#handler makes a request and rejects with an error on failure and has no status code', async (t) => {
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
  createMockRequest(t.context.httpsReq, null, body);

  try {
    await t.context.req.handler(customOptions);

    t.fail();
  } catch (err: any) {
    t.is(err.statusCode, 0);
  }
});

test('#handler makes a request and rejects with `null` as body', async (t) => {
  const customOptions = Object.assign({}, baseOptions, {
    uri: 'https://track.customer.io/api/v1/customers/1/events',
    body: JSON.stringify({ title: 'The Batman' }),
    method: 'POST',
  });

  createMockRequest(t.context.httpsReq, 500, null);

  try {
    await t.context.req.handler(customOptions);

    t.fail();
  } catch (err: any) {
    t.is(err.message, 'Unknown error');
  }
});

test('#handler makes a request and rejects with a bad JSON response', async (t) => {
  const customOptions = Object.assign({}, baseOptions, {
    uri: 'https://track.customer.io/api/v1/customers/1/events',
    body: JSON.stringify({ title: 'The Batman' }),
    method: 'POST',
  });

  createMockRequest(t.context.httpsReq, 200, '<html></html>');

  try {
    await t.context.req.handler(customOptions);

    t.fail();
  } catch (err: any) {
    t.is(
      err.message,
      'Unable to parse JSON. Error: SyntaxError: Unexpected token < in JSON at position 0 \nBody:\n <html></html>',
    );
  }
});

test('#handler makes a request and rejects with timeout error', async (t) => {
  const customOptions = Object.assign({}, baseOptions, {
    method: 'PUT',
    body: JSON.stringify(data),
    timeout: 1,
  });
  createMockRequest(t.context.httpsReq, 200, null, new Error('ETIMEDOUT'));

  try {
    await t.context.req.handler(customOptions);

    t.fail();
  } catch (err: any) {
    t.is(err.message, 'ETIMEDOUT');
  }
});

test('#get calls the handler, makes GET request with the correct args', (t) => {
  createMockRequest(t.context.httpsReq, 200);
  sinon.stub(t.context.req, 'handler');
  t.context.req.get(uri);
  t.truthy((t.context.req.handler as SinonStub).calledWith({ ...baseOptions, method: 'GET', body: null }));
});

test('#get returns the promise generated by the handler', (t) => {
  createMockRequest(t.context.httpsReq, 200);
  const promise = t.context.req.get(uri);
  t.is(promise.constructor.name, 'Promise');
});

test('#put calls the handler, makes PUT request with the correct args', (t) => {
  createMockRequest(t.context.httpsReq, 200);
  sinon.stub(t.context.req, 'handler');
  t.context.req.put(uri, data);
  t.truthy((t.context.req.handler as SinonStub).calledWith(putOptions));
});

test('#put calls the handler, makes PUT request with default data', (t) => {
  createMockRequest(t.context.httpsReq, 200);
  sinon.stub(t.context.req, 'handler');
  t.context.req.put(uri);
  t.truthy(
    (t.context.req.handler as SinonStub).calledWith({
      ...putOptions,
      body: JSON.stringify({}),
      headers: Object.assign({}, baseOptions.headers, {
        'Content-Length': 2,
      }),
    }),
  );
});

test('#put returns the promise generated by the handler', (t) => {
  createMockRequest(t.context.httpsReq, 200);
  const promise = t.context.req.put(uri, data);
  t.is(promise.constructor.name, 'Promise');
});

test('#get returns the promise generated by the handler', (t) => {
  createMockRequest(t.context.httpsReq, 200);
  const promise = t.context.req.get(uri);
  t.is(promise.constructor.name, 'Promise');
});

const deleteOptions = Object.assign({}, baseOptions, { method: 'DELETE', body: null });

test('#destroy calls the handler, makes a DELETE request with the correct args', (t) => {
  createMockRequest(t.context.httpsReq, 200);
  sinon.stub(t.context.req, 'handler');
  t.context.req.destroy(uri);
  t.truthy((t.context.req.handler as SinonStub).calledWith(deleteOptions));
});

test('#destroy returns the promise generated by the handler', (t) => {
  createMockRequest(t.context.httpsReq, 200);
  const promise = t.context.req.destroy(uri);
  t.is(promise.constructor.name, 'Promise');
});

const postOptions = Object.assign({}, baseOptions, {
  method: 'POST',
  body: JSON.stringify(data),
  headers: Object.assign({}, baseOptions.headers, {
    'Content-Length': JSON.stringify(data).length,
  }),
});

test('#post calls the handler, makes a POST request with the correct args', (t) => {
  createMockRequest(t.context.httpsReq, 200);
  sinon.stub(t.context.req, 'handler');
  t.context.req.post(uri, data);
  t.truthy((t.context.req.handler as SinonStub).calledWith(postOptions));
});

test('#post returns the promise generated by the handler', (t) => {
  createMockRequest(t.context.httpsReq, 200);
  const promise = t.context.req.post(uri);
  t.is(promise.constructor.name, 'Promise');
});
