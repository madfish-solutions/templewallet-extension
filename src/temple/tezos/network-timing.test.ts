import { TezosNetworkEssentials } from 'temple/networks';

import { loadTezosNetworkTiming } from './network-timing';

const mockGetConstants = jest.fn();

jest.mock('./rpc-client', () => ({
  getTezosRpcClient: () => ({ getConstants: mockGetConstants })
}));

const network: TezosNetworkEssentials = {
  chainId: 'NetX',
  rpcBaseURL: 'https://rpc.example.com'
};

describe('loadTezosNetworkTiming', () => {
  beforeEach(() => {
    loadTezosNetworkTiming.clear();
    mockGetConstants.mockReset();
  });

  it('derives timing from minimal block delay', async () => {
    mockGetConstants.mockResolvedValue({ minimal_block_delay: 12 });

    await expect(loadTezosNetworkTiming(network)).resolves.toEqual({
      blockDurationMs: 12_000,
      confirmationTimeoutMs: 36_000
    });
  });

  it('uses fallback timing when minimal block delay is malformed', async () => {
    mockGetConstants.mockResolvedValue({ minimal_block_delay: 0 });

    await expect(loadTezosNetworkTiming(network)).resolves.toEqual({
      blockDurationMs: 6_000,
      confirmationTimeoutMs: 30_000
    });
  });

  it('uses fallback timing when constants cannot be loaded', async () => {
    mockGetConstants.mockRejectedValue(new Error('RPC unavailable'));

    await expect(loadTezosNetworkTiming(network)).resolves.toEqual({
      blockDurationMs: 6_000,
      confirmationTimeoutMs: 30_000
    });
  });

  it('caches timing by chain and RPC URL', async () => {
    mockGetConstants.mockResolvedValue({ minimal_block_delay: 6 });

    await loadTezosNetworkTiming(network);
    await loadTezosNetworkTiming({ ...network });
    await loadTezosNetworkTiming({ ...network, rpcBaseURL: 'https://other-rpc.example.com' });

    expect(mockGetConstants).toHaveBeenCalledTimes(2);
  });
});
