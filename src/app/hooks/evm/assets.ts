import {
  useEvmStoredCollectiblesRecordSelector,
  useEvmStoredTokensRecordSelector
} from 'app/store/evm/assets/selectors';

export const useEvmChainAccountTokensSlugs = (publicKeyHash: HexString, chainId: number) => {
  const storedTokensRecord = useEvmStoredTokensRecordSelector();

  const accountTokens = storedTokensRecord[publicKeyHash] ?? {};
  const chainIdTokens = accountTokens[chainId] ?? {};

  return Object.keys(chainIdTokens);
};

export const useEvmChainAccountCollectiblesSlugs = (publicKeyHash: HexString, chainId: number) => {
  const storedCollectiblesRecord = useEvmStoredCollectiblesRecordSelector();

  const accountCollectibles = storedCollectiblesRecord[publicKeyHash] ?? {};
  const chainIdCollectibles = accountCollectibles[chainId] ?? {};

  return Object.keys(chainIdCollectibles);
};
