import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { TokenSlugMetadataRecord } from 'app/store/evm/tokens-metadata/state';
import { EvmTokenMetadata } from 'lib/metadata/types';

export const useEvmChainTokensMetadata = (chainId: number): TokenSlugMetadataRecord => {
  const metadataRecord = useEvmTokensMetadataRecordSelector();

  return metadataRecord[chainId] ?? {};
};

export const useEvmTokenMetadata = (chainId: number, tokenSlug: string): EvmTokenMetadata | undefined => {
  const chainTokensMetadata = useEvmChainTokensMetadata(chainId);

  return chainTokensMetadata[tokenSlug];
};
