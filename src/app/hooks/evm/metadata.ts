import { useEvmCollectiblesMetadataRecordSelector } from 'app/store/evm/collectibles-metadata/selectors';
import { CollectibleSlugCollectibleMetadataRecord } from 'app/store/evm/collectibles-metadata/state';
import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { TokenSlugTokenMetadataRecord } from 'app/store/evm/tokens-metadata/state';
import { EvmCollectibleMetadata, EvmTokenMetadata } from 'lib/metadata/types';

export const useEvmChainTokensMetadata = (chainId: number): TokenSlugTokenMetadataRecord => {
  const metadataRecord = useEvmTokensMetadataRecordSelector();

  return metadataRecord[chainId] ?? {};
};

const useEvmChainCollectiblesMetadata = (chainId: number): CollectibleSlugCollectibleMetadataRecord => {
  const metadataRecord = useEvmCollectiblesMetadataRecordSelector();

  return metadataRecord[chainId] ?? {};
};

export const useEvmTokenMetadata = (chainId: number, tokenSlug: string): EvmTokenMetadata | undefined => {
  const chainTokensMetadata = useEvmChainTokensMetadata(chainId);

  return chainTokensMetadata[tokenSlug];
};

export const useEvmCollectibleMetadata = (chainId: number, tokenSlug: string): EvmCollectibleMetadata | undefined => {
  const chainCollectiblesMetadata = useEvmChainCollectiblesMetadata(chainId);

  return chainCollectiblesMetadata[tokenSlug];
};
