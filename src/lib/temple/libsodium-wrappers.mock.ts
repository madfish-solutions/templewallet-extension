import { mockSodiumUtil } from './beacon.mock';

jest.mock('libsodium-wrappers', () => ({
  ...jest.requireActual('libsodium-wrappers'),
  ...mockSodiumUtil
}));
