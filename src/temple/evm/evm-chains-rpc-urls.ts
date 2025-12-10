import { fetchFromStorage, putToStorage } from 'lib/storage';
import { EVM_DEFAULT_NETWORKS } from 'temple/networks';

export const EVM_CHAINS_ALL_RPC_URLS_STORAGE_KEY = 'evmChainsRpcUrls';
const EVM_CHAINS_ACTIVE_RPC_URLS_STORAGE_KEY = 'activeEvmChainsRpcUrls';

export type ChainsActiveRpcUrls = Partial<StringRecord>;
export type ChainsAllRpcUrls = Partial<StringRecord<string[]>>;

const DEFAULT_CHAINS_ALL_RPC_URLS = EVM_DEFAULT_NETWORKS.reduce<ChainsAllRpcUrls>((acc, { chainId, rpcBaseURL }) => {
  const previousChainRpcs = acc[chainId];
  if (previousChainRpcs) {
    previousChainRpcs.push(rpcBaseURL);
  } else {
    acc[chainId] = [rpcBaseURL];
  }

  return acc;
}, {});

const DEFAULT_CHAINS_ACTIVE_RPC_URLS = EVM_DEFAULT_NETWORKS.reduce<ChainsActiveRpcUrls>(
  (acc, { chainId, rpcBaseURL }) => {
    if (!acc[chainId]) {
      acc[chainId] = rpcBaseURL;
    }

    return acc;
  },
  {}
);

export const getEvmChainsAllRpcUrls = async () =>
  (await fetchFromStorage<ChainsAllRpcUrls>(EVM_CHAINS_ALL_RPC_URLS_STORAGE_KEY)) ?? DEFAULT_CHAINS_ALL_RPC_URLS;

export const setEvmChainsAllRpcUrls = (urls: ChainsAllRpcUrls) =>
  putToStorage(EVM_CHAINS_ALL_RPC_URLS_STORAGE_KEY, urls);

export const getEvmChainsActiveRpcUrls = async () =>
  (await fetchFromStorage<ChainsActiveRpcUrls>(EVM_CHAINS_ACTIVE_RPC_URLS_STORAGE_KEY)) ??
  DEFAULT_CHAINS_ACTIVE_RPC_URLS;

export const setEvmChainsActiveRpcUrls = (urls: ChainsActiveRpcUrls) =>
  putToStorage(EVM_CHAINS_ACTIVE_RPC_URLS_STORAGE_KEY, urls);
