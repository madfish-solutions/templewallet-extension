import { useSelector } from 'app/store/root-state.selector';
import { Route3EvmTokenMetadata } from 'lib/metadata/types';

export const use3RouteEvmTokensMetadataRecordSelector = () =>
  useSelector(({ route3EvmTokensMetadata }) => route3EvmTokensMetadata.metadataRecord);

export const use3RouteEvmChainTokensMetadataSelector = (chainId: number) =>
  useSelector(({ route3EvmTokensMetadata }) => route3EvmTokensMetadata.metadataRecord[chainId]);

export const use3RouteEvmChainTokensMetadataLoadingSelector = () =>
  useSelector(({ route3EvmTokensMetadata }) => route3EvmTokensMetadata.isLoading);

export const use3RouteEvmTokenMetadataSelector = (
  chainId: number,
  tokenSlug: string
): Route3EvmTokenMetadata | undefined =>
  useSelector(({ route3EvmTokensMetadata }) => route3EvmTokensMetadata.metadataRecord[chainId]?.[tokenSlug]);

export const use3RouteEvmSupportedChainIdsSelector = () =>
  useSelector(({ route3EvmTokensMetadata }) => route3EvmTokensMetadata.supportedChainIds);
