import { browser } from 'lib/browser';

import { getAlchemySubmission, getAlchemySubmissionKey, parseAlchemySubmission } from './submission';

jest.mock('lib/browser', () => ({
  browser: {
    storage: {
      local: { get: jest.fn() }
    }
  }
}));

it('reads valid recovery records from local storage', async () => {
  const account = '0x1111111111111111111111111111111111111111';
  const key = getAlchemySubmissionKey(account, 1);
  const record = {
    version: 1,
    attempts: [],
    steps: [],
    quote: {}
  };
  (browser.storage.local.get as jest.Mock).mockResolvedValue({ [key]: record });
  expect(await getAlchemySubmission(account, 1)).toEqual(record);
});

it('rejects invalid recovery records', () => {
  expect(parseAlchemySubmission(undefined)).toBeUndefined();
  expect(() => parseAlchemySubmission({ version: 2 })).toThrow('Unsupported');
  expect(() => parseAlchemySubmission({ version: 1, quote: {}, steps: [], attempts: 'invalid' })).toThrow(
    'Unsupported'
  );
});
