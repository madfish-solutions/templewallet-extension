import { useEvmTokensMetadataRecordSelector } from 'app/store/evm/tokens-metadata/selectors';
import { EvmTokenMetadata } from 'lib/metadata/types';

export const useEvmTokenMetadata = (chainId: number, tokenSlug: string): EvmTokenMetadata | undefined => {
  const metadataRecord = useEvmTokensMetadataRecordSelector();
  const chainTokensMetadata = metadataRecord[chainId] ?? {};

  return chainTokensMetadata[tokenSlug];
};
