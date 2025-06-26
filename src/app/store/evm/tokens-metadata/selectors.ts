import { useSelector } from 'app/store/root-state.selector';
import { EvmTokenMetadata } from 'lib/metadata/types';

export const useEvmTokensMetadataRecordSelector = () =>
  useSelector(({ evmTokensMetadata }) => evmTokensMetadata.metadataRecord);

export const useEvmChainTokensMetadataRecordSelector = (chainId: number): StringRecord<EvmTokenMetadata> | undefined =>
  useSelector(({ evmTokensMetadata }) => evmTokensMetadata.metadataRecord[chainId]);

export const useEvmTokenMetadataSelector = (chainId: number, tokenSlug: string): EvmTokenMetadata | undefined =>
  useSelector(({ evmTokensMetadata }) => evmTokensMetadata.metadataRecord[chainId]?.[tokenSlug]);
