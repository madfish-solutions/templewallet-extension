import { fetchEvmAccountInitialized } from 'lib/apis/temple/endpoints/evm';
import { TzktAccountType, getAccountStatsFromTzkt } from 'lib/apis/tzkt';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { evmOnChainBalancesRequestsExecutor } from 'lib/evm/on-chain/balance';
import { COMMON_MAINNET_CHAIN_IDS, TempleTezosChainId } from 'lib/temple/types';
import { ETHERLINK_RPC_URL } from 'temple/networks';

const existentAccountTypes = [TzktAccountType.Contract, TzktAccountType.Delegate, TzktAccountType.User];

const makeFetchInitializedFn = (fetchFn: (address: string) => Promise<boolean>) => (address?: string) =>
  address ? fetchFn(address).catch(() => undefined) : Promise.resolve(false);
const fetchTezosInitialized = makeFetchInitializedFn(address =>
  getAccountStatsFromTzkt(address, TempleTezosChainId.Mainnet).then(({ type }) => existentAccountTypes.includes(type))
);
const fetchEtherlinkInitialized = makeFetchInitializedFn(account =>
  evmOnChainBalancesRequestsExecutor
    .executeRequest({
      network: { rpcBaseURL: ETHERLINK_RPC_URL, chainId: COMMON_MAINNET_CHAIN_IDS.etherlink },
      assetSlug: EVM_TOKEN_SLUG,
      account: account as HexString
    })
    .then(balance => balance.gt(0))
);
const fetchGoldrushEvmInitialized = makeFetchInitializedFn(account =>
  fetchEvmAccountInitialized(account).then(({ isInitialized }) => isInitialized)
);

export const accountIsInitialized = async (tezosAddress?: string, evmAddress?: string) => {
  const networksInitializationFlags = await Promise.all([
    fetchTezosInitialized(tezosAddress),
    // TODO: Remake this part when integrating Etherlink API
    fetchEtherlinkInitialized(evmAddress),
    fetchGoldrushEvmInitialized(evmAddress)
  ]);

  if (networksInitializationFlags.some(Boolean)) {
    return true;
  }

  return networksInitializationFlags.some(flag => flag === undefined) ? undefined : false;
};
