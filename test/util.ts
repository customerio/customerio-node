import avaTest, { TestFn } from 'ava';
import { cleanEmail } from '../lib/utils';

type TestContext = {};

const test = avaTest as TestFn<TestContext>;

test('#cleanEmail correctly formats email (default)', (t) => {
  let email = 'hello+test@world.com';
  let result = cleanEmail(email);
  t.is(result, 'hello%2Btest@world.com');

  email = 'test@world.com';
  result = cleanEmail(email);
  t.is(result, 'test@world.com');

  email = '';
  result = cleanEmail(email);
  t.is(result, '');
});
