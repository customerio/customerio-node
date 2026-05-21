import avaTest, { TestFn } from 'ava';

type TestContext = {};

const test = avaTest as TestFn<TestContext>;
