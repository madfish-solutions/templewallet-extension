import { EvmTokenMetadata } from 'lib/metadata/types';

import { useSelector } from '../../root-state.selector';

export const useEvmTokensMetadataRecordSelector = () =>
  useSelector(({ evmTokensMetadata }) => evmTokensMetadata.metadataRecord);

export const useEvmTokenMetadataSelector = (chainId: number, tokenSlug: string): EvmTokenMetadata | undefined =>
  useSelector(({ evmTokensMetadata }) => evmTokensMetadata.metadataRecord[chainId]?.[tokenSlug]);
