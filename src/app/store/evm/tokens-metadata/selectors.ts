import { EvmTokenMetadata } from 'lib/metadata/types';
import { EMPTY_FROZEN_OBJ } from 'lib/utils';

import { useSelector } from '../../root-state.selector';

import { TokenSlugTokenMetadataRecord } from './state';

export const useEvmTokensMetadataRecordSelector = () =>
  useSelector(({ evmTokensMetadata }) => evmTokensMetadata.metadataRecord);

export const useEvmChainTokensMetadataSelector = (chainId: number): TokenSlugTokenMetadataRecord =>
  useSelector(({ evmTokensMetadata }) => evmTokensMetadata.metadataRecord[chainId]) ?? EMPTY_FROZEN_OBJ;

export const useEvmTokenMetadataSelector = (chainId: number, tokenSlug: string): EvmTokenMetadata | undefined =>
  useSelector(({ evmTokensMetadata }) => evmTokensMetadata.metadataRecord[chainId]?.[tokenSlug]);
