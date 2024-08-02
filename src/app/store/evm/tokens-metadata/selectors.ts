import { useSelector } from 'app/store/root-state.selector';
import { EvmTokenMetadata } from 'lib/metadata/types';

export const useEvmTokensMetadataRecordSelector = () =>
  useSelector(({ evmTokensMetadata }) => evmTokensMetadata.metadataRecord);

export const useEvmTokenMetadataSelector = (chainId: number, tokenSlug: string): EvmTokenMetadata | undefined =>
  useSelector(({ evmTokensMetadata }) => evmTokensMetadata.metadataRecord[chainId]?.[tokenSlug]);
