const test = require('ava');
const Request = require('../lib/request');

// setup & fixture data
const appKey = 'abc';
const auth = `Bearer ${appKey}`;

test.beforeEach((t) => {
  t.context.req = new Request(appKey, { timeout: 5000 });
});

// tests begin here
test('constructor sets all properties correctly', (t) => {
  t.is(t.context.req.appKey, appKey);
  t.deepEqual(t.context.req.defaults, { timeout: 5000 });
  t.is(t.context.req.auth, auth);
});

test('constructor sets default timeout correctly', (t) => {
  const req = new Request();
  t.deepEqual(req.defaults, { timeout: 10000 });
});
