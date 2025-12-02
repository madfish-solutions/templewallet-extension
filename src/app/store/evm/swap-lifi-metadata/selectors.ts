import { useSelector } from 'app/store/root-state.selector';
import { LifiEvmTokenMetadata } from 'lib/metadata/types';

export const useLifiConnectedEvmTokensMetadataRecordSelector = () =>
  useSelector(({ lifiEvmTokensMetadata }) => lifiEvmTokensMetadata.connectedTokensMetadataRecord);

export const useLifiEnabledNetworksEvmTokensMetadataRecordSelector = () =>
  useSelector(({ lifiEvmTokensMetadata }) => lifiEvmTokensMetadata.enabledChainsTokensMetadataRecord);

export const useLifiConnectedEvmChainTokensMetadataSelector = (chainId: number) =>
  useSelector(({ lifiEvmTokensMetadata }) => ({
    metadata: lifiEvmTokensMetadata.connectedTokensMetadataRecord[chainId],
    isLoading: lifiEvmTokensMetadata.isLoading
  }));

export const useLifiEnabledNetworksEvmChainTokensMetadataSelector = (chainId: number) =>
  useSelector(({ lifiEvmTokensMetadata }) => lifiEvmTokensMetadata.enabledChainsTokensMetadataRecord[chainId]);

export const useLifiEvmTokenMetadataSelector = (chainId: number, tokenSlug: string): LifiEvmTokenMetadata | undefined =>
  useSelector(
    ({ lifiEvmTokensMetadata }) =>
      lifiEvmTokensMetadata.connectedTokensMetadataRecord[chainId]?.[tokenSlug] ??
      lifiEvmTokensMetadata.enabledChainsTokensMetadataRecord[chainId]?.[tokenSlug]
  );

export const useLifiEvmMetadataLastFetchTimeSelector = () =>
  useSelector(({ lifiEvmTokensMetadata }) => lifiEvmTokensMetadata.lastFetchTime);

export const useLifiSupportedChainIdsSelector = () =>
  useSelector(({ lifiEvmTokensMetadata }) => lifiEvmTokensMetadata.supportedChainIds);
