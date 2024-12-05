import { fetchFromStorage, putToStorage } from 'lib/storage';
import { EVM_DEFAULT_NETWORKS } from 'temple/networks';

export const EVM_CHAINS_RPC_URLS_STORAGE_KEY = 'evmChainsRpcUrls';

export type ChainsRpcUrls = Partial<StringRecord<string[]>>;

const DEFAULT_CHAINS_RPC_URLS = EVM_DEFAULT_NETWORKS.reduce<ChainsRpcUrls>(
  (acc, { chainId, rpcBaseURL }) => ({
    ...acc,
    [chainId]: [rpcBaseURL]
  }),
  {}
);

export const getEvmChainsRpcUrls = async () =>
  (await fetchFromStorage<Partial<StringRecord<string[]>>>(EVM_CHAINS_RPC_URLS_STORAGE_KEY)) ?? DEFAULT_CHAINS_RPC_URLS;

export const setEvmChainsRpcUrls = (urls: Partial<StringRecord<string[]>>) =>
  putToStorage(EVM_CHAINS_RPC_URLS_STORAGE_KEY, urls);
