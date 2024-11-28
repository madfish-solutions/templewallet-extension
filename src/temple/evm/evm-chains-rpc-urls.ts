import { fetchFromStorage, putToStorage } from 'lib/storage';
import { EVM_DEFAULT_NETWORKS } from 'temple/networks';

const EVM_CHAINS_RPC_URLS_STORAGE_KEY = 'evmChainsRpcUrls';

const DEFAULT_CHAINS_RPC_URLS = EVM_DEFAULT_NETWORKS.reduce<Partial<StringRecord>>(
  (acc, { chainId, rpcBaseURL }) => ({
    ...acc,
    [chainId]: rpcBaseURL
  }),
  {}
);

export const getEvmChainsRpcUrls = async () =>
  (await fetchFromStorage<Partial<StringRecord>>(EVM_CHAINS_RPC_URLS_STORAGE_KEY)) ?? DEFAULT_CHAINS_RPC_URLS;

export const setEvmChainsRpcUrls = (urls: Partial<StringRecord>) => putToStorage(EVM_CHAINS_RPC_URLS_STORAGE_KEY, urls);
