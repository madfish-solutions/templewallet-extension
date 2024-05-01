import { useSelector } from '../../root-state.selector';

export const useEvmCollectiblesMetadataRecordSelector = () =>
  useSelector(({ evmCollectiblesMetadata }) => evmCollectiblesMetadata.metadataRecord);
