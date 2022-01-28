import test from 'ava';
import sinon from 'sinon';
import fs from 'fs';
import { resolve } from 'path';
import { findPackageJson } from '../lib/utils';

const PACKAGE_JSON = JSON.parse(fs.readFileSync(resolve(__dirname, '..', 'package.json')).toString());

test.serial('#findPackageJson walks the tree to find package.json', (t) => {
  const sandbox = sinon.createSandbox();
  const statSpy = sandbox.spy(fs, 'statSync');
  const readSpy = sandbox.spy(fs, 'readFileSync');

  // No package.json in the test directory
  let json = findPackageJson(__dirname);

  t.deepEqual(JSON.parse(json), PACKAGE_JSON, 'returns the correct package.json');
  t.is(statSpy.callCount, 3, 'statSync called three times');
  t.deepEqual(
    statSpy.getCall(0).args,
    [resolve(__dirname, 'package.json')],
    'called with the correct arguments initially',
  );
  t.deepEqual(statSpy.getCall(1).args, [resolve(__dirname, '..')], 'checks if parent directory exists');
  t.deepEqual(
    statSpy.getCall(2).args,
    [resolve(__dirname, '..', 'package.json')],
    'checks if package.json in parent directory exists',
  );

  statSpy.restore();
  readSpy.restore();
});

test.serial('#findPackageJson returns a default if no package.json is found', (t) => {
  const sandbox = sinon.createSandbox();
  const statStub = sandbox.stub(fs, 'statSync').throws();
  const readSpy = sandbox.spy(fs, 'readFileSync');

  let json = findPackageJson(__dirname);

  t.is(json, '', 'returns an empty string');
  t.is(statStub.callCount, 2, 'statSync called two times');
  t.deepEqual(
    statStub.getCall(0).args,
    [resolve(__dirname, 'package.json')],
    'called with the correct arguments initially',
  );
  t.deepEqual(statStub.getCall(1).args, [resolve(__dirname, '..')], 'checks if parent directory exists');

  statStub.restore();
  readSpy.restore();
});
