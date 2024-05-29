import {
  useEvmStoredCollectiblesRecordSelector,
  useEvmStoredTokensRecordSelector
} from 'app/store/evm/assets/selectors';

export const useRawEvmChainAccountTokens = (publicKeyHash: HexString, chainId: number) => {
  const storedTokensRecord = useEvmStoredTokensRecordSelector();
  const accountTokens = storedTokensRecord[publicKeyHash] ?? {};

  return accountTokens[chainId] ?? {};
};

export const useRawEvmChainAccountCollectibles = (publicKeyHash: HexString, chainId: number) => {
  const storedCollectiblesRecord = useEvmStoredCollectiblesRecordSelector();
  const accountCollectibles = storedCollectiblesRecord[publicKeyHash] ?? {};

  return accountCollectibles[chainId] ?? {};
};
