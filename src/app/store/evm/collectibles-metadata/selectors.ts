import { EvmCollectibleMetadata } from 'lib/metadata/types';

import { useSelector } from '../../root-state.selector';

export const useEvmCollectiblesMetadataRecordSelector = () =>
  useSelector(({ evmCollectiblesMetadata }) => evmCollectiblesMetadata.metadataRecord);

export const useEvmCollectibleMetadataSelector = (
  chainId: number,
  collectibleSlug: string
): EvmCollectibleMetadata | undefined =>
  useSelector(({ evmCollectiblesMetadata }) => evmCollectiblesMetadata.metadataRecord[chainId]?.[collectibleSlug]);
