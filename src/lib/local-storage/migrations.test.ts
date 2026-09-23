import './migrations';

import browser from 'webextension-polyfill';

import { migrate } from './migrator';

jest.mock('./migrator', () => ({ migrate: jest.fn() }));
jest.mock('webextension-polyfill', () => ({ storage: { local: { get: jest.fn(), remove: jest.fn() } } }));

it('removes old signed batch records without removing other wallet data', async () => {
  const migration = (migrate as jest.MockedFunction<typeof migrate>).mock.calls[0][0].find(
    item => item.name === 'remove-alchemy-swap-recovery'
  );
  const stored = {
    'alchemy-swap-v1:account:1': { attempts: [{ signed: { signature: 'old-signature' } }] },
    'alchemy-swap-v1:account:10': { version: 1 },
    'wallet-settings': { language: 'en' }
  };
  (browser.storage.local.get as jest.Mock).mockResolvedValue(stored);
  await migration!.up();
  expect(browser.storage.local.remove).toHaveBeenCalledWith([
    'alchemy-swap-v1:account:1',
    'alchemy-swap-v1:account:10'
  ]);
});
