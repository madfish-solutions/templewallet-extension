import { browser } from 'lib/browser';

import { getAlchemySubmission, getAlchemySubmissionKey, migrateAlchemySubmission } from './submission';

jest.mock('lib/browser', () => ({
  browser: {
    storage: {
      local: { get: jest.fn(), set: jest.fn() },
      session: { get: jest.fn(), remove: jest.fn() }
    }
  }
}));

it('migrates session records before a retry', async () => {
  const account = '0x1111111111111111111111111111111111111111';
  const key = getAlchemySubmissionKey(account, 1);
  const record = { version: 1, attempts: [] };
  (browser.storage.local.get as jest.Mock).mockResolvedValue({});
  (browser.storage.session!.get as jest.Mock).mockResolvedValue({ [key]: record });
  expect(await getAlchemySubmission(account, 1)).toEqual(record);
  expect(browser.storage.local.set).toHaveBeenCalledWith({ [key]: record });
  expect(browser.storage.session!.remove).toHaveBeenCalledWith(key);
});

it('does not discard an unknown recovery schema', () => {
  expect(migrateAlchemySubmission(undefined)).toBeUndefined();
  expect(() => migrateAlchemySubmission({ version: 2 })).toThrow('Unsupported');
});
