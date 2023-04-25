import { useSelector } from '../index';

// ts-prune-ignore-next
export const useTokenMetadataSelector = (slug: string) =>
  useSelector(state => state.tokensMetadata.metadataRecord[slug]);

// ts-prune-ignore-next
export const useTokensMetadataSelector = () => useSelector(({ tokensMetadata }) => tokensMetadata.metadataRecord);

// export const useAddTokenSuggestionSelector = () =>
//   useSelector(({ tokensMetadata }) => tokensMetadata.addTokenSuggestion);
