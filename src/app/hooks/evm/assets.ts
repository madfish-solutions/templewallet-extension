import { useEvmStoredAssetsRecordSelector } from 'app/store/evm/assets/selectors';

export const useEvmChainAccountAssetsSlugs = (publicKeyHash: HexString, chainId: number) => {
  const storedAssetsRecord = useEvmStoredAssetsRecordSelector();

  const accountAssets = storedAssetsRecord[publicKeyHash] ?? {};
  const chainIdAssets = accountAssets[chainId] ?? {};

  return Object.keys(chainIdAssets);
};
