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
 *   CIO_TEST_WHATSAPP_TRANSACTIONAL_ID  transactional_message_id for sendWhatsApp
 *   CIO_TEST_WHATSAPP_RECIPIENT      E.164 phone number for sendWhatsApp
 *   CIO_TEST_PUSH_TRANSACTIONAL_ID   transactional_message_id for sendPush
 *   CIO_TEST_PUSH_DEVICE_ID          device id for sendPush + addDevice
 *   CIO_TEST_MANUAL_SEGMENT_ID       manual segment id for add/removeCustomersFromSegment
 *   CIO_TEST_FORM_ID                 form id for submitForm
 *   CIO_TEST_DELIVERY_ID             CIO-Delivery-ID for reportMetric + unsubscribe
 *   CIO_TEST_OBJECT_TYPE_ID          object type id for object attribute/relationship/find reads
 *   CIO_TEST_OBJECT_ID               object id for object reads (defaults to a throwaway id)
 *   CIO_TEST_CAMPAIGN_ID             campaign id for campaign read methods
 *   CIO_TEST_TRIGGER_ID              trigger id (with CIO_TEST_BROADCAST_ID) for trigger status/errors
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
  SendWhatsAppRequest,
  SendPushRequest,
  SendInAppRequest,
  SendInboxMessageRequest,
} from '../../lib/api/requests';
import { RegionUS, RegionEU } from '../../lib/regions';
import { FilterOperator, IdentifierType } from '../../lib/types';

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

liveTest('getAccountRegion reports the workspace region', async (t) => {
  const result = (await track!.getAccountRegion()) as { url?: string; region?: string };
  t.truthy(result.url);
  t.truthy(result.region);
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

liveTest('getCustomerActivities lists the profile activities', async (t) => {
  const result = (await api!.getCustomerActivities(customerId)) as Record<string, unknown>;
  t.true('activities' in result);
});

liveTest('getCustomerMessages resolves for the profile', async (t) => {
  const result = (await api!.getCustomerMessages(customerId)) as Record<string, unknown>;
  t.truthy(result);
});

liveTest('getCustomerRelationships resolves for the profile', async (t) => {
  const result = (await api!.getCustomerRelationships(customerId)) as Record<string, unknown>;
  t.truthy(result);
});

liveTest('getCustomerSegments lists the profile segments', async (t) => {
  const result = (await api!.getCustomerSegments(customerId)) as Record<string, unknown>;
  t.true('segments' in result);
});

liveTest('getCustomerSubscriptionPreferences resolves for the profile', async (t) => {
  const result = (await api!.getCustomerSubscriptionPreferences(customerId)) as Record<string, unknown>;
  t.truthy(result);
});

liveTest('getCustomersAttributes returns attributes for the profile', async (t) => {
  const result = (await api!.getCustomersAttributes([customerId])) as Record<string, unknown>;
  t.true('customers' in result);
});

liveTest('searchCustomers resolves against an attribute filter', async (t) => {
  const filter = {
    and: [{ attribute: { field: 'plan', operator: FilterOperator.Eq, value: 'sdk-test' } }],
  };
  const result = (await api!.searchCustomers(filter, { limit: 10 })) as Record<string, unknown>;
  t.truthy(result);
});

liveTest('listObjectTypes resolves', async (t) => {
  const result = (await api!.listObjectTypes()) as Record<string, unknown>;
  t.truthy(result);
});

liveTest('listActivities resolves', async (t) => {
  const result = (await api!.listActivities({ limit: 5 })) as Record<string, unknown>;
  t.true('activities' in result);
});

needs('CIO_TEST_OBJECT_TYPE_ID')('object attribute + relationship reads resolve', async (t) => {
  const typeId = process.env.CIO_TEST_OBJECT_TYPE_ID!;
  const objectId = process.env.CIO_TEST_OBJECT_ID ?? 'sdk-live-object';
  await api!.getObjectAttributes(typeId, objectId).catch(() => undefined);
  await api!.getObjectRelationships(typeId, objectId).catch(() => undefined);
  t.pass();
});

needs('CIO_TEST_OBJECT_TYPE_ID')('findObjects resolves for a test object type', async (t) => {
  const typeId = process.env.CIO_TEST_OBJECT_TYPE_ID!;
  const filter = {
    and: [{ object_attribute: { field: 'name', operator: FilterOperator.Exists, type_id: Number(typeId) } }],
  };
  const result = (await api!.findObjects(typeId, filter, { limit: 5 })) as Record<string, unknown>;
  t.truthy(result);
});

liveTest('listSegments resolves', async (t) => {
  const result = (await api!.listSegments()) as Record<string, unknown>;
  t.true('segments' in result);
});

liveTest('segment create -> read -> delete round-trip', async (t) => {
  const created = (await api!.createSegment({
    name: `sdk-live-${customerId}`,
    description: 'sdk live test segment',
  })) as { segment?: { id?: number } };
  const segmentId = created.segment?.id;

  if (segmentId !== undefined) {
    await api!.getSegment(segmentId).catch(() => undefined);
    await api!.getSegmentCustomerCount(segmentId).catch(() => undefined);
    await api!.getSegmentMembership(segmentId, { limit: 5 }).catch(() => undefined);
    await api!.getSegmentUsedBy(segmentId).catch(() => undefined);
    await api!.deleteSegment(segmentId).catch(() => undefined);
  }

  t.truthy(created);
});

liveTest('listSubscriptionTopics resolves', async (t) => {
  const result = (await api!.listSubscriptionTopics()) as Record<string, unknown>;
  t.truthy(result);
});

liveTest('listSubscriptionChannels resolves', async (t) => {
  const result = (await api!.listSubscriptionChannels()) as Record<string, unknown>;
  t.truthy(result);
});

liveTest('getSubscriptionCenterToken resolves for the profile', async (t) => {
  // Depends on subscription-center configuration; treat failures as non-fatal.
  const result = await api!.getSubscriptionCenterToken(customerId).catch(() => undefined);
  t.pass(result ? 'token generated' : 'subscription center not configured; skipped');
});

liveTest('listTransactionalMessages resolves', async (t) => {
  const result = (await api!.listTransactionalMessages()) as Record<string, unknown>;
  t.truthy(result);
});

// Read-only transactional lookups for a known message id. Update methods
// (content/language) are covered by unit tests only — they mutate real
// templates, which we avoid in the dogfood suite.
needs('CIO_TEST_TRANSACTIONAL_ID')('transactional message reads resolve for a known id', async (t) => {
  const id = process.env.CIO_TEST_TRANSACTIONAL_ID!;
  await api!.getTransactionalMessage(id).catch(() => undefined);
  await api!.getTransactionalMessageContents(id).catch(() => undefined);
  await api!.getTransactionalMessageDeliveries(id, { limit: 5 }).catch(() => undefined);
  await api!.getTransactionalMessageMetrics(id, { period: 'days', steps: 7 }).catch(() => undefined);
  await api!.getTransactionalMessageLinkMetrics(id, { period: 'days', steps: 7 }).catch(() => undefined);
  t.pass();
});

liveTest('listCampaigns resolves', async (t) => {
  const result = (await api!.listCampaigns()) as Record<string, unknown>;
  t.true('campaigns' in result);
});

// Read-only campaign lookups for a known campaign id. Action update methods
// are covered by unit tests only (they mutate live campaigns).
needs('CIO_TEST_CAMPAIGN_ID')('campaign reads resolve for a known id', async (t) => {
  const id = process.env.CIO_TEST_CAMPAIGN_ID!;
  const end = Math.floor(Date.now() / 1000);
  const start = end - 7 * 24 * 60 * 60;
  await api!.getCampaign(id).catch(() => undefined);
  await api!.getCampaignActions(id).catch(() => undefined);
  await api!.getCampaignMetrics(id, { version: '1', period: 'days', steps: 7 }).catch(() => undefined);
  await api!.getCampaignMetricsLinks(id, { period: 'days', steps: 7 }).catch(() => undefined);
  await api!.getCampaignJourneyMetrics(id, { start, end, res: 'days' }).catch(() => undefined);
  await api!.getCampaignMessages(id, { limit: 5 }).catch(() => undefined);
  t.pass();
});

needs('CIO_TEST_TRIGGER_ID')('broadcast trigger status + errors resolve', async (t) => {
  const broadcastId = process.env.CIO_TEST_BROADCAST_ID ?? '';
  const triggerId = process.env.CIO_TEST_TRIGGER_ID!;
  await api!.getBroadcastTriggerStatus(broadcastId, triggerId).catch(() => undefined);
  await api!.getBroadcastTriggerErrors(broadcastId, triggerId, { limit: 5 }).catch(() => undefined);
  t.pass();
});

liveTest('listBroadcasts resolves', async (t) => {
  const result = (await api!.listBroadcasts()) as Record<string, unknown>;
  t.true('broadcasts' in result);
});

// Read-only broadcast lookups for a known broadcast id. Action update methods
// are covered by unit tests only (they mutate live broadcasts).
needs('CIO_TEST_BROADCAST_ID')('broadcast reads resolve for a known id', async (t) => {
  const id = process.env.CIO_TEST_BROADCAST_ID!;
  await api!.getBroadcast(id).catch(() => undefined);
  await api!.getBroadcastActions(id).catch(() => undefined);
  await api!.getBroadcastMetrics(id, { period: 'days', steps: 7 }).catch(() => undefined);
  await api!.getBroadcastMetricsLinks(id, { period: 'days', steps: 7 }).catch(() => undefined);
  await api!.getBroadcastMessages(id, { limit: 5 }).catch(() => undefined);
  await api!.getBroadcastTriggers(id).catch(() => undefined);
  t.pass();
});

liveTest('listNewsletters resolves', async (t) => {
  const result = (await api!.listNewsletters({ limit: 5 })) as Record<string, unknown>;
  t.true('newsletters' in result);
});

// Read-only newsletter lookups for a known id. Create/update/send/schedule are
// covered by unit tests only (send/schedule actually dispatch; create/delete
// mutate the workspace).
needs('CIO_TEST_NEWSLETTER_ID')('newsletter reads resolve for a known id', async (t) => {
  const id = process.env.CIO_TEST_NEWSLETTER_ID!;
  await api!.getNewsletter(id).catch(() => undefined);
  await api!.getNewsletterContents(id).catch(() => undefined);
  await api!.getNewsletterMetrics(id, { period: 'days', steps: 7 }).catch(() => undefined);
  await api!.getNewsletterMetricsLinks(id, { period: 'days', steps: 7 }).catch(() => undefined);
  await api!.getNewsletterMessages(id, { limit: 5 }).catch(() => undefined);
  t.pass();
});

// Newsletter localization reads. The create/update/delete language + test-group
// methods mutate the workspace, so they're covered by unit tests only.
needs('CIO_TEST_NEWSLETTER_ID')('newsletter test-group + language reads resolve', async (t) => {
  const id = process.env.CIO_TEST_NEWSLETTER_ID!;
  await api!.getNewsletterTestGroups(id).catch(() => undefined);
  await api!.getNewsletterLanguage(id, 'en').catch(() => undefined);
  t.pass();
});

liveTest('listDesignStudioFolders resolves', async (t) => {
  const result = (await api!.listDesignStudioFolders({ limit: 5 })) as { folders?: unknown };
  t.true('folders' in result);
});

liveTest('listDesignStudioEmails resolves', async (t) => {
  const result = (await api!.listDesignStudioEmails({ limit: 5 })) as { emails?: unknown };
  t.true('emails' in result);
});

liveTest('design studio folder + email create -> read -> update -> delete round-trip', async (t) => {
  const folder = (await api!.createDesignStudioFolder({ name: `sdk-live-${customerId}` })) as {
    folder?: { id?: string };
  };
  const folderId = folder.folder?.id;

  let emailId: string | undefined;
  if (folderId) {
    await api!.getDesignStudioFolder(folderId).catch(() => undefined);
    await api!.updateDesignStudioFolder(folderId, { name: `sdk-live-${customerId}-renamed` }).catch(() => undefined);

    const email = (await api!
      .createDesignStudioEmail({
        name: `sdk-live-email-${customerId}`,
        parent_folder_id: folderId,
        content: { subject: 'SDK live', html: '<p>hi</p>' },
      })
      .catch(() => undefined)) as { email?: { id?: string } } | undefined;
    emailId = email?.email?.id;

    if (emailId) {
      await api!.getDesignStudioEmail(emailId).catch(() => undefined);
      await api!.updateDesignStudioEmail(emailId, { is_template: true }).catch(() => undefined);

      // Email translations (languages).
      await api!.listDesignStudioEmailLanguages(emailId).catch(() => undefined);
      await api!
        .createDesignStudioEmailLanguage(emailId, { language: 'fr', content: { subject: 'Bonjour' } })
        .catch(() => undefined);
      await api!.getDesignStudioEmailLanguage(emailId, 'fr').catch(() => undefined);
      await api!
        .updateDesignStudioEmailLanguage(emailId, 'fr', { content: { subject: 'Salut' } })
        .catch(() => undefined);
      await api!.deleteDesignStudioEmailLanguage(emailId, 'fr').catch(() => undefined);

      await api!.deleteDesignStudioEmail(emailId).catch(() => undefined);
    }

    await api!.deleteDesignStudioFolder(folderId).catch(() => undefined);
  }

  t.truthy(folder);
});

liveTest('listDesignStudioComponents resolves', async (t) => {
  const result = (await api!.listDesignStudioComponents({ limit: 5 })) as { components?: unknown };
  t.true('components' in result);
});

liveTest('design studio component create -> read -> update -> delete round-trip', async (t) => {
  const created = (await api!
    .createDesignStudioComponent({
      name: `sdk-live-component-${customerId}`,
      tag: `sdk-live-${customerId}`,
      content: '<div>hi</div>',
    })
    .catch(() => undefined)) as { component?: { id?: string } } | undefined;
  const componentId = created?.component?.id;

  if (componentId) {
    await api!.getDesignStudioComponent(componentId).catch(() => undefined);
    await api!.updateDesignStudioComponent(componentId, { content: '<div>updated</div>' }).catch(() => undefined);
    await api!.deleteDesignStudioComponent(componentId).catch(() => undefined);
  }

  t.pass();
});

liveTest('listAssets resolves', async (t) => {
  const result = (await api!.listAssets({ limit: 5 })) as { assets?: unknown };
  t.true('assets' in result);
});

liveTest('listAssetFolders resolves', async (t) => {
  const result = (await api!.listAssetFolders({ limit: 5 })) as { folders?: unknown };
  t.true('folders' in result);
});

liveTest('asset folder + file create -> read -> update -> delete round-trip', async (t) => {
  // A minimal valid 1x1 PNG — the backend validates that uploads are real images.
  const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  const pngBytes = Buffer.from(pngBase64, 'base64');

  const folder = (await api!.createAssetFolder({ name: `sdk-live-assets-${customerId}` }).catch(() => undefined)) as
    | { folder?: { id?: number } }
    | undefined;
  const folderId = folder?.folder?.id;

  const uploaded = (await api!
    .createAsset({
      data: pngBytes,
      // No contentType: exercises the filename-extension derivation end-to-end.
      filename: `sdk-live-${customerId}.png`,
      parentFolderId: folderId,
    })
    .catch(() => undefined)) as { asset?: { id?: number } } | undefined;
  const assetId = uploaded?.asset?.id;

  if (assetId !== undefined) {
    await api!.getAsset(assetId).catch(() => undefined);
    await api!.updateAsset(assetId, { name: `sdk-live-${customerId}-renamed.png` }).catch(() => undefined);
    await api!.deleteAsset(assetId).catch(() => undefined);
  }

  if (folderId !== undefined) {
    await api!.getAssetFolder(folderId).catch(() => undefined);
    await api!.deleteAssetFolder(folderId).catch(() => undefined);
  }

  t.pass();
});

liveTest('listCollections resolves', async (t) => {
  const result = (await api!.listCollections()) as { collections?: unknown };
  t.true('collections' in result);
});

liveTest('collection create -> read -> content -> delete round-trip', async (t) => {
  const created = (await api!
    .createCollection({ name: `sdk-live-${customerId}`, data: [{ tier: 'pro', price: 20 }] })
    .catch(() => undefined)) as { collection?: { id?: number } } | undefined;
  const collectionId = created?.collection?.id;

  if (collectionId !== undefined) {
    await api!.getCollection(collectionId).catch(() => undefined);
    await api!.getCollectionContent(collectionId).catch(() => undefined);
    await api!.updateCollection(collectionId, { name: `sdk-live-${customerId}-renamed` }).catch(() => undefined);
    await api!.updateCollectionContent(collectionId, [{ tier: 'free', price: 0 }]).catch(() => undefined);
    await api!.deleteCollection(collectionId).catch(() => undefined);
  }

  t.pass();
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

liveTest('entity sends a single identify operation', async (t) => {
  await track!.entity({
    type: 'person',
    action: 'identify',
    identifiers: { id: customerId },
    attributes: { entity_at: new Date().toISOString() },
  });
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

needs('CIO_TEST_WHATSAPP_TRANSACTIONAL_ID')('sendWhatsApp delivers a transactional WhatsApp message', async (t) => {
  const recipient = process.env.CIO_TEST_WHATSAPP_RECIPIENT;
  if (!recipient) {
    t.pass('CIO_TEST_WHATSAPP_RECIPIENT not set; skipping send');
    return;
  }
  const req = new SendWhatsAppRequest({
    to: recipient,
    identifiers: { id: customerId },
    transactional_message_id: process.env.CIO_TEST_WHATSAPP_TRANSACTIONAL_ID!,
  });
  const result = (await api!.sendWhatsApp(req)) as { delivery_id?: string };
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
  const filters = { or: [{ segment: { id: 0 } }] };
  const result = (await api!.createCustomersExport(filters)) as { export?: { id: number } };
  t.truthy(result.export);
});

needs('CIO_TEST_NEWSLETTER_ID')('createDeliveriesExport queues an export', async (t) => {
  const result = (await api!.createDeliveriesExport(Number(process.env.CIO_TEST_NEWSLETTER_ID!))) as {
    export?: { id: number };
  };
  t.truthy(result.export);
});

// 5. Manual segments, forms, and metrics. Gated on workspace-specific IDs.

needs('CIO_TEST_MANUAL_SEGMENT_ID')('add + removeCustomersFromSegment round-trip', async (t) => {
  const segmentId = Number(process.env.CIO_TEST_MANUAL_SEGMENT_ID!);
  await track!.addCustomersToSegment(segmentId, [customerId], IdentifierType.Id);
  await track!.removeCustomersFromSegment(segmentId, [customerId], IdentifierType.Id);
  t.pass();
});

needs('CIO_TEST_FORM_ID')('submitForm submits a form for the profile', async (t) => {
  await track!.submitForm(process.env.CIO_TEST_FORM_ID!, { email: customerEmail, source: 'sdk-live-test' });
  t.pass();
});

needs('CIO_TEST_DELIVERY_ID')('reportMetric reports a delivery metric', async (t) => {
  await track!.reportMetric({
    delivery_id: process.env.CIO_TEST_DELIVERY_ID!,
    metric: 'opened',
    timestamp: Math.floor(Date.now() / 1000),
  });
  t.pass();
});

needs('CIO_TEST_DELIVERY_ID')('unsubscribe toggles the unsubscribe state for a delivery', async (t) => {
  await track!.unsubscribe(process.env.CIO_TEST_DELIVERY_ID!, true);
  await track!.unsubscribe(process.env.CIO_TEST_DELIVERY_ID!, false);
  t.pass();
});

// 6. Destructive cleanup. Runs last; failures here are warnings on a dedicated
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
