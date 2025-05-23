import { useSelector } from 'app/store/root-state.selector';
import { LifiEvmTokenMetadata } from 'lib/metadata/types';

export const useLifiEvmTokensMetadataRecordSelector = () =>
  useSelector(({ lifiEvmTokensMetadata }) => lifiEvmTokensMetadata.metadataRecord);

export const useLifiEvmChainTokensMetadataSelector = (chainId: number) =>
  useSelector(({ lifiEvmTokensMetadata }) => ({
    metadata: lifiEvmTokensMetadata.metadataRecord[chainId],
    isLoading: lifiEvmTokensMetadata.isLoading
  }));

export const useLifiEvmTokenMetadataSelector = (chainId: number, tokenSlug: string): LifiEvmTokenMetadata | undefined =>
  useSelector(({ lifiEvmTokensMetadata }) => lifiEvmTokensMetadata.metadataRecord[chainId]?.[tokenSlug]);
