import { useSelector } from '../../root-state.selector';

export const useEvmTokensMetadataRecordSelector = () =>
  useSelector(({ evmTokensMetadata }) => evmTokensMetadata.metadataRecord);
