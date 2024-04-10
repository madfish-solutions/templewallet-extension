import { useSelector } from '../../root-state.selector';

export const useAllEVMTokensMetadataSelector = () =>
  useSelector(({ evmTokensMetadata }) => evmTokensMetadata.metadataRecord);
