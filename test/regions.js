import test from 'ava';
import { Region, RegionUS, RegionEU } from '../lib/regions.js';

test('RegionUS exposes the expected hosts', (t) => {
  t.is(RegionUS.trackUrl, 'https://track.customer.io/api/v1');
  t.is(RegionUS.trackV2Url, 'https://track.customer.io/api/v2');
  t.is(RegionUS.apiUrl, 'https://api.customer.io/v1');
  t.is(RegionUS.pipelinesUrl, 'https://cdp.customer.io/v1');
});

test('RegionEU exposes the expected hosts', (t) => {
  t.is(RegionEU.trackUrl, 'https://track-eu.customer.io/api/v1');
  t.is(RegionEU.trackV2Url, 'https://track-eu.customer.io/api/v2');
  t.is(RegionEU.apiUrl, 'https://api-eu.customer.io/v1');
  t.is(RegionEU.pipelinesUrl, 'https://cdp-eu.customer.io/v1');
});

test('Region constructor accepts an explicit pipelinesUrl', (t) => {
  const region = new Region(
    'https://track.example.com/api/v1',
    'https://api.example.com/v1',
    'https://cdp.example.com/v1',
  );

  t.is(region.pipelinesUrl, 'https://cdp.example.com/v1');
});

test('Region instances are recognized via the Symbol.for brand check', (t) => {
  const region = new Region(
    'https://track.example.com/api/v1',
    'https://api.example.com/v1',
    'https://cdp.example.com/v1',
  );

  t.true(region instanceof Region);
});
