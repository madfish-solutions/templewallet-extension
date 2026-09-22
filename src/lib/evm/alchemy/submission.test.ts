import { browser } from 'lib/browser';

import { getAlchemySubmission, getAlchemySubmissionKey, parseAlchemySubmission } from './submission';
import { account, makeSubmission } from './test-fixtures';
jest.mock('lib/browser', () => ({ browser: { storage: { local: { get: jest.fn() } } } }));
it('reads a complete recovery record', async () => {
  const record = makeSubmission();
  (browser.storage.local.get as jest.Mock).mockResolvedValue({ [getAlchemySubmissionKey(account, 1)]: record });
  expect(await getAlchemySubmission(account, 1)).toEqual(record);
});
it.each([undefined, '0x1234'])('migrates version 1 records without an accepted response: %s', id => {
  const record = makeSubmission();
  const old = {
    ...record,
    version: 1,
    attempts: [{ signed: record.attempts[0].signed, ...(id ? { id: record.attempts[0].id } : {}) }]
  };
  expect(parseAlchemySubmission(old)?.attempts[0]).toEqual({
    ...record.attempts[0],
    state: id ? 'pending' : 'unknown'
  });
  expect(parseAlchemySubmission(old)?.version).toBe(2);
});
it.each([{}, { version: 3 }, { version: 1, quote: {}, steps: [], attempts: [] }])(
  'rejects malformed records: %j',
  value => {
    expect(() => parseAlchemySubmission(value)).toThrow('Unsupported');
  }
);
it('rejects a mismatched operation ID', () => {
  const record = makeSubmission();
  record.attempts[0].id = '0x1234';
  expect(() => parseAlchemySubmission(record)).toThrow('Unsupported');
});
it('preserves the missing-record result', () => expect(parseAlchemySubmission(undefined)).toBeUndefined());
