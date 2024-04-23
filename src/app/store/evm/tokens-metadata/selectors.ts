import { useSelector } from '../../root-state.selector';

export const useAllEvmTokensMetadataSelector = () =>
  useSelector(({ evmTokensMetadata }) => evmTokensMetadata.metadataRecord);

export const useEvmTokenMetadataSelector = (slugWithChainId: string) =>
  useSelector(({ evmTokensMetadata }) => evmTokensMetadata.metadataRecord[slugWithChainId]);
