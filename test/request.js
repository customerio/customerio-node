import test from 'ava';
import https from 'https';
import sinon from 'sinon';
import { PassThrough } from 'stream';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import CIORequest from '../lib/request.js';

const siteid = '123';
const apikey = 'abc';
const appKey = 'abc';
const uri = 'https://track.customer.io/api/v1/customers/1';
const data = { first_name: 'Bruce', last_name: 'Wayne' };
const trackAuth = `Basic ${Buffer.from(`${siteid}:${apikey}`).toString('base64')}`;
const appAuth = `Bearer ${appKey}`;
const PACKAGE_VERSION = JSON.parse(readFileSync(resolve(import.meta.dirname, '..', 'package.json')).toString()).version;
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
  headers: { ...baseOptions.headers, 'Content-Length': JSON.stringify(data).length },
});

const createMockRequest = (httpsReq, statusCode, body = '', error, headers = {}) => {
  const response = new PassThrough();
  const request = new PassThrough();
  request.on('finish', () => {
    /** @type {any} */ (response).statusCode = statusCode;
    /** @type {any} */ (response).headers = headers;
    if (error) {
      request.destroy(error);
    } else {
      response.write(typeof body === 'object' ? JSON.stringify(body) : body);
      response.end();
    }
  });
  httpsReq.callsArgWith(1, response).returns(/** @type {any} */ (request));
  return httpsReq;
};

test.beforeEach((t) => {
  t.context.httpsReq = sinon.stub(https, 'request');
  t.context.req = new CIORequest({ siteid: '123', apikey: 'abc' }, { timeout: 5000 });
});
test.afterEach((t) => {
  t.context.httpsReq.restore();
});

test.serial('constructor sets all properties correctly for track api', (t) => {
  t.is(t.context.req.siteid, '123');
  t.is(t.context.req.apikey, 'abc');
  t.deepEqual(t.context.req.defaults, { timeout: 5000 });
  t.is(t.context.req.auth, trackAuth);
});
test.serial('constructor sets default timeout correctly for track api', (t) => {
  const req = new CIORequest({ siteid, apikey });
  t.deepEqual(req.defaults, { timeout: 10000 });
});
test.serial('constructor sets all properties correctly for app api', (t) => {
  const req = new CIORequest(appKey, { timeout: 5000 });
  t.is(req.appKey, appKey);
  t.deepEqual(req.defaults, { timeout: 5000 });
  t.is(req.auth, appAuth);
});
test.serial('constructor sets default timeout correctly for app api', (t) => {
  const req = new CIORequest(appKey);
  t.deepEqual(req.defaults, { timeout: 10000 });
});
test.serial('#options returns a correctly formatted object', (t) => {
  t.deepEqual(t.context.req.options(uri, 'POST'), { ...baseOptions, method: 'POST', body: null });
});
test.serial('#options sets Content-Length using body length in bytes', (t) => {
  const body = { first_name: 'Wïly Wönka' };
  t.deepEqual(t.context.req.options(uri, 'POST', body), {
    ...baseOptions,
    method: 'POST',
    headers: { ...baseOptions.headers, 'Content-Length': 29 },
    body: JSON.stringify(body),
  });
});
test.serial('#options merges custom headers from defaults.headers', (t) => {
  const req = new CIORequest({ siteid, apikey }, { timeout: 5000, headers: { 'X-Strict-Mode': '1' } });
  const result = req.options(uri, 'POST');
  t.is(/** @type {Record<string, string>} */ (result.headers)['X-Strict-Mode'], '1');
  t.is(/** @type {Record<string, string>} */ (result.headers).Authorization, trackAuth);
  t.is(/** @type {Record<string, string>} */ (result.headers)['Content-Type'], 'application/json');
});
test.serial('#options does not allow defaults.headers to clobber the standard headers', (t) => {
  const req = new CIORequest(
    { siteid, apikey },
    {
      timeout: 5000,
      headers: { Authorization: 'Basic should-be-ignored', 'Content-Type': 'text/plain', 'User-Agent': 'spoofed' },
    },
  );
  const result = req.options(uri, 'POST');
  t.is(/** @type {Record<string, string>} */ (result.headers).Authorization, trackAuth);
  t.is(/** @type {Record<string, string>} */ (result.headers)['Content-Type'], 'application/json');
  t.is(
    /** @type {Record<string, string>} */ (result.headers)['User-Agent'],
    `Customer.io Node Client/${PACKAGE_VERSION}`,
  );
});
test.serial('#handler returns a promise', (t) => {
  createMockRequest(t.context.httpsReq, 200);
  t.is(t.context.req.handler(putOptions).constructor.name, 'Promise');
});
test.serial('#handler makes a request and resolves a promise on success', async (t) => {
  const body = {};
  createMockRequest(t.context.httpsReq, 200, body);
  try {
    t.deepEqual(await t.context.req.handler(putOptions), body);
  } catch {
    t.fail();
  }
});
test.serial('#handler makes a request and parses the uri correctly', async (t) => {
  const customOptions = {
    ...baseOptions,
    headers: { ...baseOptions.headers, 'X-Test-Identifier': 'uri test' },
    uri: 'https://track.customer.io/api/v1/customers/1/events',
    body: JSON.stringify({ title: 'The Batman' }),
    method: 'POST',
  };
  createMockRequest(t.context.httpsReq, 200, {});
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
    t.deepEqual(res, {});
  } catch {
    t.fail();
  }
});
test.serial('#handler makes a request and rejects with an error on failure', async (t) => {
  const message = 'test error message';
  createMockRequest(t.context.httpsReq, 400, { meta: { error: message } });
  try {
    await t.context.req.handler({
      ...baseOptions,
      uri: 'https://track.customer.io/api/v1/customers/1/events',
      body: JSON.stringify({ title: 'The Batman' }),
      method: 'POST',
    });
    t.fail();
  } catch (/** @type {any} */ err) {
    t.is(err.message, message);
  }
});
test.serial('#handler rejects with multiple errors', async (t) => {
  const m1 = 'test error message one',
    m2 = 'test error message two';
  createMockRequest(t.context.httpsReq, 400, { meta: { errors: [m1, m2] } });
  try {
    await t.context.req.handler({
      ...baseOptions,
      uri: 'https://track.customer.io/api/v1/customers/1/events',
      body: JSON.stringify({ title: 'The Batman' }),
      method: 'POST',
    });
    t.fail();
  } catch (/** @type {any} */ err) {
    t.is(err.message, `2 errors:\n  - ${m1}\n  - ${m2}`);
  }
});
test.serial('#handler rejects with single error in array', async (t) => {
  const message = 'test error message';
  createMockRequest(t.context.httpsReq, 400, { meta: { errors: [message] } });
  try {
    await t.context.req.handler({
      ...baseOptions,
      uri: 'https://track.customer.io/api/v1/customers/1/events',
      body: JSON.stringify({ title: 'The Batman' }),
      method: 'POST',
    });
    t.fail();
  } catch (/** @type {any} */ err) {
    t.is(err.message, `1 error:\n  - ${message}`);
  }
});
test.serial('#handler rejects with unexpected error structure', async (t) => {
  createMockRequest(t.context.httpsReq, 400, { error: 'test error message' });
  try {
    await t.context.req.handler({
      ...baseOptions,
      uri: 'https://track.customer.io/api/v1/customers/1/events',
      body: JSON.stringify({ title: 'The Batman' }),
      method: 'POST',
    });
    t.fail();
  } catch (/** @type {any} */ err) {
    t.is(err.message, 'Unknown error');
  }
});
test.serial('#handler rejects with no status code', async (t) => {
  createMockRequest(t.context.httpsReq, null, { meta: { error: 'test error message' } });
  try {
    await t.context.req.handler({
      ...baseOptions,
      uri: 'https://track.customer.io/api/v1/customers/1/events',
      body: JSON.stringify({ title: 'The Batman' }),
      method: 'POST',
    });
    t.fail();
  } catch (/** @type {any} */ err) {
    t.is(err.statusCode, 0);
  }
});
test.serial('#handler rejects with null body', async (t) => {
  createMockRequest(t.context.httpsReq, 500, null);
  try {
    await t.context.req.handler(
      Object.assign({}, baseOptions, {
        uri: 'https://track.customer.io/api/v1/customers/1/events',
        body: JSON.stringify({ title: 'The Batman' }),
        method: 'POST',
      }),
    );
    t.fail();
  } catch (/** @type {any} */ err) {
    t.is(err.message, 'Unknown error');
  }
});
test.serial('#handler rejects with bad JSON response', async (t) => {
  createMockRequest(t.context.httpsReq, 200, '<html></html>');
  try {
    await t.context.req.handler(
      Object.assign({}, baseOptions, {
        uri: 'https://track.customer.io/api/v1/customers/1/events',
        body: JSON.stringify({ title: 'The Batman' }),
        method: 'POST',
      }),
    );
    t.fail();
  } catch (/** @type {any} */ err) {
    t.regex(err.message, /Unexpected token <|Unable to parse JSON/);
  }
});
test.serial('#handler rejects with timeout error', async (t) => {
  createMockRequest(t.context.httpsReq, 200, null, new Error('ETIMEDOUT'));
  try {
    await t.context.req.handler(
      Object.assign({}, baseOptions, { method: 'PUT', body: JSON.stringify(data), timeout: 1 }),
    );
    t.fail();
  } catch (/** @type {any} */ err) {
    t.is(err.message, 'ETIMEDOUT');
  }
});
test.serial('#handler destroys the request and rejects when the socket times out', async (t) => {
  const request = new PassThrough();
  const originalDestroy = request.destroy.bind(request);
  request.destroy = (/** @type {Error | undefined} */ err) => {
    if (err) {
      request.emit('error', err);
    }
    return originalDestroy(err);
  };
  t.context.httpsReq.returns(/** @type {any} */ (request));
  const promise = t.context.req.handler(Object.assign({}, baseOptions, { method: 'PUT', body: JSON.stringify(data) }));
  setImmediate(() => request.emit('timeout'));
  try {
    await promise;
    t.fail('Expected handler to reject on timeout');
  } catch (/** @type {any} */ err) {
    t.is(err.message, 'Request timed out after 5000ms');
  }
});
test.serial('#handler follows redirects', async (t) => {
  const usResponse = new PassThrough(),
    usRequest = new PassThrough(),
    euResponse = new PassThrough(),
    euRequest = new PassThrough();
  const body = { redirected: true };
  usRequest.on('finish', () => {
    /** @type {any} */ (usResponse).statusCode = 301;
    /** @type {any} */ (usResponse).headers = { location: 'https://track-eu.customer.io/api/v1/customers/1' };
    usResponse.end();
  });
  euRequest.on('finish', () => {
    /** @type {any} */ (euResponse).statusCode = 200;
    /** @type {any} */ (euResponse).headers = {};
    euResponse.write(JSON.stringify(body));
    euResponse.end();
  });
  t.context.httpsReq
    .withArgs(sinon.match.any)
    .callsArgWith(1, usResponse)
    .returns(/** @type {any} */ (usRequest))
    .withArgs(sinon.match.has('hostname', 'track-eu.customer.io'))
    .callsArgWith(1, euResponse)
    .returns(/** @type {any} */ (euRequest));
  try {
    t.deepEqual(
      await t.context.req.handler(
        Object.assign({}, baseOptions, { method: 'PUT', body: JSON.stringify(data), timeout: 1 }),
      ),
      body,
    );
    t.is(t.context.httpsReq.callCount, 2);
  } catch {
    t.fail();
  }
});
test.serial('#handler forwards the original request body across redirects', async (t) => {
  const usResponse = new PassThrough(),
    usRequest = new PassThrough(),
    euResponse = new PassThrough(),
    euRequest = new PassThrough();
  const originalBody = JSON.stringify(data);
  let euRequestBody = '';
  euRequest.on(
    'data',
    /** @param {Buffer} chunk */ (chunk) => {
      euRequestBody += chunk.toString('utf-8');
    },
  );
  usRequest.on('finish', () => {
    /** @type {any} */ (usResponse).statusCode = 301;
    /** @type {any} */ (usResponse).headers = { location: 'https://track-eu.customer.io/api/v1/customers/1' };
    usResponse.write('redirect-response-body-not-a-payload');
    usResponse.end();
  });
  euRequest.on('finish', () => {
    /** @type {any} */ (euResponse).statusCode = 200;
    /** @type {any} */ (euResponse).headers = {};
    euResponse.write(JSON.stringify({ ok: true }));
    euResponse.end();
  });
  t.context.httpsReq
    .withArgs(sinon.match.any)
    .callsArgWith(1, usResponse)
    .returns(/** @type {any} */ (usRequest))
    .withArgs(sinon.match.has('hostname', 'track-eu.customer.io'))
    .callsArgWith(1, euResponse)
    .returns(/** @type {any} */ (euRequest));
  await t.context.req.handler(Object.assign({}, baseOptions, { method: 'PUT', body: originalBody }));
  t.is(euRequestBody, originalBody);
});
test.serial('#handler strips Authorization on redirects to non-customer.io hosts', async (t) => {
  const usResponse = new PassThrough(),
    usRequest = new PassThrough(),
    evilResponse = new PassThrough(),
    evilRequest = new PassThrough();
  const body = { redirected: true };
  usRequest.on('finish', () => {
    /** @type {any} */ (usResponse).statusCode = 301;
    /** @type {any} */ (usResponse).headers = { location: 'https://evil.example.com/api/v1/customers/1' };
    usResponse.end();
  });
  evilRequest.on('finish', () => {
    /** @type {any} */ (evilResponse).statusCode = 200;
    /** @type {any} */ (evilResponse).headers = {};
    evilResponse.write(JSON.stringify(body));
    evilResponse.end();
  });
  t.context.httpsReq
    .withArgs(sinon.match.any)
    .callsArgWith(1, usResponse)
    .returns(/** @type {any} */ (usRequest))
    .withArgs(sinon.match.has('hostname', 'evil.example.com'))
    .callsArgWith(1, evilResponse)
    .returns(/** @type {any} */ (evilRequest));
  const res = await t.context.req.handler(
    Object.assign({}, baseOptions, { method: 'PUT', body: JSON.stringify(data), timeout: 1 }),
  );
  t.deepEqual(res, body);
  t.is(t.context.httpsReq.callCount, 2);
  const secondCallArgs = /** @type {{ headers: Record<string, string | undefined> }} */ (
    t.context.httpsReq.getCall(1).args[0]
  );
  t.false('Authorization' in secondCallArgs.headers);
  t.is(secondCallArgs.headers.Authorization, undefined);
});
test.serial('#handler preserves Authorization on redirects within *.customer.io', async (t) => {
  const usResponse = new PassThrough(),
    usRequest = new PassThrough(),
    euResponse = new PassThrough(),
    euRequest = new PassThrough();
  const body = { redirected: true };
  usRequest.on('finish', () => {
    /** @type {any} */ (usResponse).statusCode = 301;
    /** @type {any} */ (usResponse).headers = { location: 'https://track-eu.customer.io/api/v1/customers/1' };
    usResponse.end();
  });
  euRequest.on('finish', () => {
    /** @type {any} */ (euResponse).statusCode = 200;
    /** @type {any} */ (euResponse).headers = {};
    euResponse.write(JSON.stringify(body));
    euResponse.end();
  });
  t.context.httpsReq
    .withArgs(sinon.match.any)
    .callsArgWith(1, usResponse)
    .returns(/** @type {any} */ (usRequest))
    .withArgs(sinon.match.has('hostname', 'track-eu.customer.io'))
    .callsArgWith(1, euResponse)
    .returns(/** @type {any} */ (euRequest));
  const res = await t.context.req.handler(
    Object.assign({}, baseOptions, { method: 'PUT', body: JSON.stringify(data), timeout: 1 }),
  );
  t.deepEqual(res, body);
  t.is(t.context.httpsReq.callCount, 2);
  t.is(
    /** @type {{ headers: Record<string, string> }} */ (t.context.httpsReq.getCall(1).args[0]).headers.Authorization,
    trackAuth,
  );
});
test.serial('#handler errors when redirecting without a location header', async (t) => {
  const usResponse = new PassThrough(),
    usRequest = new PassThrough();
  usRequest.on('finish', () => {
    /** @type {any} */ (usResponse).statusCode = 301;
    /** @type {any} */ (usResponse).headers = {};
    usResponse.end();
  });
  t.context.httpsReq.callsArgWith(1, usResponse).returns(/** @type {any} */ (usRequest));
  try {
    await t.context.req.handler(
      Object.assign({}, baseOptions, { method: 'PUT', body: JSON.stringify(data), timeout: 1 }),
    );
    t.fail();
  } catch (/** @type {any} */ err) {
    t.is(err.message, 'Received a 301 status, but no Location header was present');
  }
});
test.serial('#get calls the handler with correct args', (t) => {
  createMockRequest(t.context.httpsReq, 200);
  sinon.stub(t.context.req, 'handler');
  t.context.req.get(uri);
  t.truthy(
    /** @type {import('sinon').SinonStub} */ (t.context.req.handler).calledWith({
      ...baseOptions,
      method: 'GET',
      body: null,
    }),
  );
});
test.serial('#get returns a promise', (t) => {
  createMockRequest(t.context.httpsReq, 200);
  t.is(t.context.req.get(uri).constructor.name, 'Promise');
});
test.serial('#put calls the handler with correct args', (t) => {
  createMockRequest(t.context.httpsReq, 200);
  sinon.stub(t.context.req, 'handler');
  t.context.req.put(uri, data);
  t.truthy(/** @type {import('sinon').SinonStub} */ (t.context.req.handler).calledWith(putOptions));
});
test.serial('#put calls the handler with default data', (t) => {
  createMockRequest(t.context.httpsReq, 200);
  sinon.stub(t.context.req, 'handler');
  t.context.req.put(uri);
  t.truthy(
    /** @type {import('sinon').SinonStub} */ (t.context.req.handler).calledWith({
      ...putOptions,
      body: JSON.stringify({}),
      headers: { ...baseOptions.headers, 'Content-Length': 2 },
    }),
  );
});
test.serial('#put returns a promise', (t) => {
  createMockRequest(t.context.httpsReq, 200);
  t.is(t.context.req.put(uri, data).constructor.name, 'Promise');
});
const deleteOptions = Object.assign({}, baseOptions, { method: 'DELETE', body: null });
test.serial('#destroy calls the handler with correct args', (t) => {
  createMockRequest(t.context.httpsReq, 200);
  sinon.stub(t.context.req, 'handler');
  t.context.req.destroy(uri);
  t.truthy(/** @type {import('sinon').SinonStub} */ (t.context.req.handler).calledWith(deleteOptions));
});
test.serial('#destroy returns a promise', (t) => {
  createMockRequest(t.context.httpsReq, 200);
  t.is(t.context.req.destroy(uri).constructor.name, 'Promise');
});
const postOptions = {
  ...baseOptions,
  method: 'POST',
  body: JSON.stringify(data),
  headers: { ...baseOptions.headers, 'Content-Length': JSON.stringify(data).length },
};
test.serial('#post calls the handler with correct args', (t) => {
  createMockRequest(t.context.httpsReq, 200);
  sinon.stub(t.context.req, 'handler');
  t.context.req.post(uri, data);
  t.truthy(/** @type {import('sinon').SinonStub} */ (t.context.req.handler).calledWith(postOptions));
});
test.serial('#handler resolves on 202 Accepted', async (t) => {
  const body = { status: 'queued' };
  createMockRequest(t.context.httpsReq, 202, body);
  try {
    t.deepEqual(await t.context.req.handler(putOptions), body);
  } catch {
    t.fail();
  }
});
test.serial('#handler resolves on 204 No Content with empty body', async (t) => {
  createMockRequest(t.context.httpsReq, 204, '');
  try {
    t.deepEqual(await t.context.req.handler(putOptions), {});
  } catch {
    t.fail();
  }
});
test.serial('#handler rejects on 300 status code', async (t) => {
  createMockRequest(t.context.httpsReq, 300, { meta: { error: 'multiple choices' } });
  try {
    await t.context.req.handler(putOptions);
    t.fail();
  } catch (/** @type {any} */ err) {
    t.is(err.statusCode, 300);
  }
});
test.serial('#post returns a promise', (t) => {
  createMockRequest(t.context.httpsReq, 200);
  t.is(t.context.req.post(uri).constructor.name, 'Promise');
});
