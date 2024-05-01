import { useEvmStoredTokensRecordSelector } from 'app/store/evm/tokens/selectors';

export const useEvmChainAccountAssetsSlugs = (publicKeyHash: HexString, chainId: number) => {
  const storedAssetsRecord = useEvmStoredTokensRecordSelector();

  const accountAssets = storedAssetsRecord[publicKeyHash] ?? {};
  const chainIdAssets = accountAssets[chainId] ?? {};

  return Object.keys(chainIdAssets);
};
