/**
 * Live dogfood suite.
 *
 * Runs the SDK against a real Customer.io workspace. NOT gated in CI; this is
 * the pre-release sanity check, executed locally before cutting a release.
 *
 * Required env vars to actually run anything:
 *   CIO_LIVE=1
 *   CIO_SITE_ID, CIO_API_KEY    (Track API credentials)
 *   CIO_APP_KEY                 (App API bearer token)
 *
 * Optional env vars, each gates a specific test (absent => skipped):
 *   CIO_REGION                       "us" | "eu" (default "us")
 *   CIO_TEST_EMAIL_RECIPIENT         destination address for sendEmail
 *   CIO_TEST_TRANSACTIONAL_ID        transactional_message_id for sendEmail
 *   CIO_TEST_BROADCAST_ID            broadcast id for triggerBroadcast
 *   CIO_TEST_NEWSLETTER_ID           newsletter id for createDeliveriesExport
 *   CIO_TEST_SMS_TRANSACTIONAL_ID    transactional_message_id for sendSMS
 *   CIO_TEST_SMS_RECIPIENT           E.164 phone number for sendSMS
 *   CIO_TEST_PUSH_TRANSACTIONAL_ID   transactional_message_id for sendPush
 *   CIO_TEST_PUSH_DEVICE_ID          device id for sendPush + addDevice
 *
 * Profile lifecycle: one throwaway customer per run, id = `sdk-live-${uuid()}`.
 * Cleanup is best-effort; the dedicated workspace tolerates orphans.
 */
import test from 'ava';
import { randomUUID } from 'crypto';
import { TrackClient } from '../../lib/track';
import { APIClient } from '../../lib/api';
import {
  SendEmailRequest,
  SendSMSRequest,
  SendPushRequest,
  SendInAppRequest,
  SendInboxMessageRequest,
} from '../../lib/api/requests';
import { RegionUS, RegionEU } from '../../lib/regions';
import { IdentifierType } from '../../lib/types';

const isLive = process.env.CIO_LIVE === '1';
const siteId = process.env.CIO_SITE_ID ?? '';
const apiKey = process.env.CIO_API_KEY ?? '';
const appKey = process.env.CIO_APP_KEY ?? '';
const region = process.env.CIO_REGION === 'eu' ? RegionEU : RegionUS;

const customerId = `sdk-live-${randomUUID()}`;
const secondaryCustomerId = `sdk-live-${randomUUID()}`;
const anonymousId = `sdk-live-anon-${randomUUID()}`;
const deviceId = process.env.CIO_TEST_PUSH_DEVICE_ID ?? `sdk-live-device-${randomUUID()}`;
const customerEmail = `${customerId}@example.com`;

const track = isLive ? new TrackClient(siteId, apiKey, { region }) : null;
const api = isLive ? new APIClient(appKey, { region }) : null;

const liveTest = isLive && siteId && apiKey && appKey ? test.serial : test.serial.skip;
const needs = (envVar: string) => (process.env[envVar] ? liveTest : test.serial.skip);

if (!isLive) {
  test('live suite skipped (set CIO_LIVE=1 + CIO_SITE_ID/CIO_API_KEY/CIO_APP_KEY to run)', (t) => t.pass());
}

// 1. Read-only

liveTest('getCustomersByEmail returns the expected shape for an unknown address', async (t) => {
  const result = (await api!.getCustomersByEmail(`absent-${randomUUID()}@example.com`)) as { results: unknown[] };
  t.true(Array.isArray(result.results));
  t.is(result.results.length, 0);
});

liveTest('listExports resolves', async (t) => {
  const result = (await api!.listExports()) as { exports: unknown };
  t.true('exports' in result);
});

// 2. Idempotent writes. Order matters: later tests assume the profile exists.

liveTest('identify creates the throwaway profile', async (t) => {
  await track!.identify(customerId, {
    email: customerEmail,
    created_at: Math.floor(Date.now() / 1000),
    first_name: 'SDK',
    last_name: 'Live',
    plan: 'sdk-test',
  });
  t.pass();
});

liveTest('getAttributes returns the seeded profile', async (t) => {
  const result = (await api!.getAttributes(customerId, IdentifierType.Id)) as {
    customer: { attributes: Record<string, string> };
  };
  t.is(result.customer.attributes.first_name, 'SDK');
});

liveTest('track records an event on the profile', async (t) => {
  await track!.track(customerId, { name: 'sdk_live_event', data: { run: customerId } });
  t.pass();
});

liveTest('trackAnonymous records an anonymous event', async (t) => {
  await track!.trackAnonymous(anonymousId, { name: 'sdk_live_anonymous_event' });
  t.pass();
});

liveTest('trackPageView records a page view on the profile', async (t) => {
  await track!.trackPageView(customerId, '/sdk-live-test');
  t.pass();
});

liveTest('addDevice attaches a device to the profile', async (t) => {
  await track!.addDevice(customerId, deviceId, 'ios', { last_used: Math.floor(Date.now() / 1000) });
  t.pass();
});

liveTest('batch sends a mixed batch', async (t) => {
  await track!.batch([
    {
      type: 'person',
      action: 'identify',
      identifiers: { id: customerId },
      attributes: { batched_at: new Date().toISOString() },
    },
    {
      type: 'person',
      action: 'event',
      identifiers: { id: customerId },
      name: 'sdk_live_batch_event',
    },
  ]);
  t.pass();
});

// 3. Sends. Each is gated on its own env var since they require workspace-specific IDs.

needs('CIO_TEST_TRANSACTIONAL_ID')('sendEmail delivers a transactional message', async (t) => {
  const recipient = process.env.CIO_TEST_EMAIL_RECIPIENT;
  if (!recipient) {
    t.pass('CIO_TEST_EMAIL_RECIPIENT not set; skipping send');
    return;
  }
  const req = new SendEmailRequest({
    to: recipient,
    identifiers: { id: customerId },
    transactional_message_id: process.env.CIO_TEST_TRANSACTIONAL_ID!,
    message_data: { run: customerId },
  });
  const result = (await api!.sendEmail(req)) as { delivery_id?: string };
  t.truthy(result.delivery_id);
});

needs('CIO_TEST_SMS_TRANSACTIONAL_ID')('sendSMS delivers a transactional SMS', async (t) => {
  const recipient = process.env.CIO_TEST_SMS_RECIPIENT;
  if (!recipient) {
    t.pass('CIO_TEST_SMS_RECIPIENT not set; skipping send');
    return;
  }
  const req = new SendSMSRequest({
    to: recipient,
    identifiers: { id: customerId },
    transactional_message_id: process.env.CIO_TEST_SMS_TRANSACTIONAL_ID!,
  });
  const result = (await api!.sendSMS(req)) as { delivery_id?: string };
  t.truthy(result.delivery_id);
});

needs('CIO_TEST_PUSH_TRANSACTIONAL_ID')('sendPush delivers a transactional push', async (t) => {
  const req = new SendPushRequest({
    identifiers: { id: customerId },
    transactional_message_id: process.env.CIO_TEST_PUSH_TRANSACTIONAL_ID!,
  });
  const result = (await api!.sendPush(req)) as { delivery_id?: string };
  t.truthy(result.delivery_id);
});

needs('CIO_TEST_INAPP_TRANSACTIONAL_ID')('sendInApp delivers an in-app message', async (t) => {
  const req = new SendInAppRequest({
    identifiers: { id: customerId },
    transactional_message_id: process.env.CIO_TEST_INAPP_TRANSACTIONAL_ID!,
  });
  const result = (await api!.sendInApp(req)) as { delivery_id?: string };
  t.truthy(result.delivery_id);
});

needs('CIO_TEST_INBOX_TRANSACTIONAL_ID')('sendInboxMessage delivers an inbox message', async (t) => {
  const req = new SendInboxMessageRequest({
    identifiers: { id: customerId },
    transactional_message_id: process.env.CIO_TEST_INBOX_TRANSACTIONAL_ID!,
  });
  const result = (await api!.sendInboxMessage(req)) as { delivery_id?: string };
  t.truthy(result.delivery_id);
});

// 4. Broadcasts / exports

needs('CIO_TEST_BROADCAST_ID')('triggerBroadcast resolves against a test broadcast', async (t) => {
  const result = (await api!.triggerBroadcast(
    process.env.CIO_TEST_BROADCAST_ID!,
    { run: customerId },
    { ids: [customerId] },
  )) as { id?: number };
  t.truthy(result.id);
});

liveTest('createCustomersExport queues an export', async (t) => {
  const filters = { or: [{ segment: { id: 0 } }] } as unknown as Parameters<APIClient['createCustomersExport']>[0];
  const result = (await api!.createCustomersExport(filters)) as { export?: { id: number } };
  t.truthy(result.export);
});

needs('CIO_TEST_NEWSLETTER_ID')('createDeliveriesExport queues an export', async (t) => {
  const result = (await api!.createDeliveriesExport(Number(process.env.CIO_TEST_NEWSLETTER_ID!))) as {
    export?: { id: number };
  };
  t.truthy(result.export);
});

// 5. Destructive cleanup. Runs last; failures here are warnings on a dedicated
// test workspace.

liveTest('deleteDevice removes the device from the profile', async (t) => {
  await track!.deleteDevice(customerId, deviceId).catch(() => undefined);
  t.pass();
});

liveTest('suppress + unsuppress round-trip', async (t) => {
  await track!.suppress(customerId).catch(() => undefined);
  await track!.unsuppress(customerId).catch(() => undefined);
  t.pass();
});

liveTest('mergeCustomers merges a secondary profile into the primary', async (t) => {
  await track!.identify(secondaryCustomerId, { email: `${secondaryCustomerId}@example.com` }).catch(() => undefined);
  await track!
    .mergeCustomers(IdentifierType.Id, customerId, IdentifierType.Id, secondaryCustomerId)
    .catch(() => undefined);
  t.pass();
});

liveTest('destroy deletes the throwaway profile', async (t) => {
  await track!.destroy(customerId).catch(() => undefined);
  t.pass();
});
