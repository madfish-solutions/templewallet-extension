import React, { act, Suspense, useEffect } from 'react';

import { mocked } from 'jest-mock';
import { createRoot, Root } from 'react-dom/client';
import { SWRConfig } from 'swr';
import browser from 'webextension-polyfill';

import { fetchConversionAccount, fetchConversionInformation, getReferralsCount, registerWallet } from 'lib/apis/temple';
import { fetchTokenTransfers } from 'lib/apis/tzkt/api';
import {
  CONVERSION_CHECKED_STORAGE_KEY,
  REFERRAL_WALLET_REGISTERED_STORAGE_KEY,
  REWARDS_BADGE_STATE_STORAGE_KEY
} from 'lib/constants';
import { APP_VERSION } from 'lib/env';
import { TempleAccountType } from 'lib/temple/types';

import { useConversionVerification } from './use-conversion-verification';
import { useRewardsBadgeVisible } from './use-rewards-badge';

const mockTrackEvent = jest.fn();
const mockHdAccount = {
  type: TempleAccountType.HD,
  id: 'test-hd',
  tezosAddress: 'tz1-test-account',
  evmAddress: '0x-test-account'
};
const mockAccounts = [mockHdAccount];
const mockTezosAccount = { address: 'tz1-test-account' };
const conversionAccount = {
  id: 'user',
  tezosAddress: 'tz1-test-account',
  evmAddress: '0x-test-account',
  referralLinkId: null,
  createdAt: '',
  extras: null,
  referralId: null,
  referralTezosAddress: null,
  referralEvmAddress: null,
  referralExtras: null
};
jest.mock('app/env', () => ({ useAppEnv: () => ({ fullPage: true }) }));
jest.mock('lib/analytics', () => ({
  useAnalytics: () => ({ trackEvent: mockTrackEvent }),
  AnalyticsEventCategory: { FormSubmitSuccess: 'form-submit-success' },
  toError: (error: unknown) => error
}));
jest.mock('lib/apis/temple', () => ({
  fetchConversionAccount: jest.fn(),
  fetchConversionInformation: jest.fn(),
  getReferralsCount: jest.fn(),
  registerWallet: jest.fn()
}));
jest.mock('lib/temple/front', () => ({
  useTempleClient: () => ({ accounts: mockAccounts, ready: true }),
  useStorage: jest.requireActual('lib/temple/front/storage').useStorage
}));

jest.mock('lib/apis/tzkt/api', () => ({ fetchTokenTransfers: jest.fn() }));
jest.mock('temple/front', () => ({
  useAccountForTezos: () => mockTezosAccount,
  useTezosMainnetChain: () => ({ chainId: 'NetXdQprcVkpaWU' })
}));

let root: Root;
let container: HTMLDivElement;
let mockFlags: Record<string, unknown>;
let resolveRegistration: () => void;
let results: string[];
let badgeVisible = false;

function Consumer({ index }: { index: number }) {
  const value: unknown = useConversionVerification();
  const kind =
    typeof value === 'object' && value !== null && 'kind' in value ? String(value.kind) : 'legacy-no-readiness';
  useEffect(() => {
    results[index] = kind;
  }, [index, kind]);
  useEffect(() => {
    if (kind === 'ready') void getReferralsCount();
  }, [kind]);
  return null;
}

function BadgeConsumer() {
  const visible = useRewardsBadgeVisible();
  useEffect(() => {
    badgeVisible = visible;
  }, [visible]);
  return null;
}

async function renderConsumers(withBadge = false) {
  const cache = new Map();
  await act(async () => {
    root.render(
      <SWRConfig value={{ provider: () => cache }}>
        <Suspense fallback={null}>
          <Consumer index={0} />
          <Consumer index={1} />
          {withBadge ? <BadgeConsumer /> : null}
        </Suspense>
      </SWRConfig>
    );
  });
}

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  results = [];
  badgeVisible = false;
  mockAccounts.splice(0, mockAccounts.length, mockHdAccount);
  mocked(fetchTokenTransfers).mockReset().mockResolvedValue([]);
  mockFlags = { [CONVERSION_CHECKED_STORAGE_KEY]: true, [REFERRAL_WALLET_REGISTERED_STORAGE_KEY]: false };
  jest.spyOn(browser.storage.local, 'get').mockImplementation(async (_keys: unknown, ...args: unknown[]) => {
    const callback = args[0];
    if (typeof callback === 'function') callback(mockFlags);
    return mockFlags;
  });
  jest.spyOn(browser.storage.local, 'set').mockImplementation(async (values, ...args: unknown[]) => {
    Object.assign(mockFlags, values);
    const callback = args[0];
    if (typeof callback === 'function') callback();
  });
  mocked(fetchConversionInformation).mockReset();
  mocked(fetchConversionAccount).mockReset().mockResolvedValue(conversionAccount);
  mocked(getReferralsCount).mockReset().mockResolvedValue('0');
  mocked(registerWallet)
    .mockReset()
    .mockImplementation(
      () =>
        new Promise(resolve => {
          resolveRegistration = () => resolve({ message: 'registered' });
        })
    );
  mockTrackEvent.mockClear();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  jest.restoreAllMocks();
});

it('shares initialization and gates referrals, but keeps payout checks running before readiness', async () => {
  let resolveSession: () => void = () => {
    throw new Error('Session validation did not start');
  };
  mocked(fetchConversionAccount).mockImplementationOnce(
    () =>
      new Promise(resolve => {
        resolveSession = () => resolve(conversionAccount);
      })
  );
  await renderConsumers(true);
  expect(registerWallet).toHaveBeenCalledTimes(1);
  expect(getReferralsCount).not.toHaveBeenCalled();
  expect(fetchTokenTransfers).toHaveBeenCalled();
  expect(results).toEqual(['pending', 'pending']);
  await act(async () => {
    resolveRegistration();
  });
  expect(getReferralsCount).not.toHaveBeenCalled();
  expect(mockFlags[REFERRAL_WALLET_REGISTERED_STORAGE_KEY]).toBe(false);
  await act(async () => {
    resolveSession();
  });
  expect(results).toEqual(['ready', 'ready']);
  expect(getReferralsCount).toHaveBeenCalledTimes(3);
  expect(mockTrackEvent).toHaveBeenCalledTimes(1);
});

function responseError(status: number, message = 'Service unavailable'): Error {
  return Object.assign(new Error(message), { isAxiosError: true, response: { status, data: { message } } });
}

it('repairs an expired cookie at page bootstrap instead of trusting the persisted flag', async () => {
  mockFlags[REFERRAL_WALLET_REGISTERED_STORAGE_KEY] = true;
  mocked(fetchConversionAccount).mockRejectedValueOnce(responseError(400, 'User ID cookie is not set'));
  await renderConsumers();
  expect(fetchConversionAccount).toHaveBeenCalledTimes(1);
  expect(registerWallet).toHaveBeenCalledTimes(1);
  expect(getReferralsCount).not.toHaveBeenCalled();
  await act(async () => {
    resolveRegistration();
  });
  expect(fetchConversionAccount).toHaveBeenCalledTimes(2);
  expect(results).toEqual(['ready', 'ready']);
});

it.each(['verification', 'account', 'registration'])(
  'keeps %s rate limiting visible and never declares readiness',
  async stage => {
    const error = responseError(429);
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    if (stage === 'verification') {
      mockFlags[CONVERSION_CHECKED_STORAGE_KEY] = false;
      mocked(fetchConversionInformation).mockRejectedValueOnce(error);
    } else if (stage === 'account') {
      mockFlags[REFERRAL_WALLET_REGISTERED_STORAGE_KEY] = true;
      mocked(fetchConversionAccount).mockRejectedValueOnce(error);
    } else {
      mocked(registerWallet).mockRejectedValueOnce(error);
    }
    await renderConsumers();
    expect(results).toEqual(['failed', 'failed']);
    expect(getReferralsCount).not.toHaveBeenCalled();
    expect(registerWallet).toHaveBeenCalledTimes(stage === 'registration' ? 1 : 0);
    expect(log).toHaveBeenCalledWith(error);
  }
);

it('accepts the expected no-referral response before registering the wallet', async () => {
  mockFlags[CONVERSION_CHECKED_STORAGE_KEY] = false;
  mocked(fetchConversionInformation).mockRejectedValueOnce(responseError(404));
  await renderConsumers();
  expect(registerWallet).toHaveBeenCalledTimes(1);
  await act(async () => {
    resolveRegistration();
  });
  expect(results).toEqual(['ready', 'ready']);
});

it('uses a valid existing session for a wallet with no HD account', async () => {
  mockAccounts.length = 0;
  mockFlags[REFERRAL_WALLET_REGISTERED_STORAGE_KEY] = true;
  await renderConsumers();
  expect(fetchConversionAccount).toHaveBeenCalledTimes(1);
  expect(registerWallet).not.toHaveBeenCalled();
  expect(results).toEqual(['ready', 'ready']);
});

it('finishes as unavailable when there is no HD account or existing session', async () => {
  mockAccounts.length = 0;
  await renderConsumers();
  expect(registerWallet).not.toHaveBeenCalled();
  expect(results).toEqual(['unavailable', 'unavailable']);
});

it('keeps an unacknowledged payout visible when referral initialization finishes', async () => {
  const lastChecked = Date.now() - 60_000;
  const payoutAt = Date.now() - 30_000;
  mockFlags[REWARDS_BADGE_STATE_STORAGE_KEY] = {
    initialized: true,
    lastChecked,
    lastReferralsCount: 0,
    lastSeenVersion: APP_VERSION
  };
  const payout = {
    id: 1,
    level: 1,
    transactionId: 1,
    amount: '1',
    timestamp: new Date(payoutAt).toISOString(),
    from: { address: 'tz1N7mkPWedKcMPHt9tgiA4SstDHS4L6LKKQ' },
    to: { address: 'tz1-test-account' },
    token: {
      contract: { address: 'KT1-test-token' },
      id: 1,
      tokenId: '0',
      standard: 'fa2',
      metadata: { name: 'Test token', symbol: 'TEST', decimals: '0' }
    }
  };
  mocked(fetchTokenTransfers).mockImplementation(async (_chain, params) => {
    const cutoff: unknown = params['timestamp.ge'];
    if (typeof cutoff !== 'string') throw new Error('Missing timestamp cutoff');
    return Date.parse(cutoff) <= payoutAt ? [payout] : [];
  });
  await renderConsumers(true);
  expect(badgeVisible).toBe(true);
  await act(async () => {
    resolveRegistration();
  });
  expect(results).toEqual(['ready', 'ready']);
  expect(badgeVisible).toBe(true);
});
