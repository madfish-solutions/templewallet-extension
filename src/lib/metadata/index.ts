import { useTokenMetadataSelector } from 'app/store/tokens-metadata/selectors';
import { isGasAsset } from 'lib/temple/assets';
import { useNetwork } from 'lib/temple/front';

import { TEZOS_METADATA, FILM_METADATA } from './defaults';
import { AssetMetadataBase, TokenMetadata } from './types';

export type { AssetMetadataBase, TokenMetadata } from './types';
export { TokenStandardsEnum } from './types';
export { TEZOS_METADATA, FILM_METADATA, EMPTY_BASE_METADATA } from './defaults';
export {
  fetchTokenMetadata,
  fetchTokensMetadata,
  loadTokenMetadata$,
  loadTokensMetadata$,
  loadWhitelist$
} from './fetch';

export const useGasTokenMetadata = () => {
  const network = useNetwork();

  return network.type === 'dcp' ? FILM_METADATA : TEZOS_METADATA;
};

export const useAssetMetadata = (slug: string): AssetMetadataBase | undefined => {
  const tokenMetadata = useTokenMetadataSelector(slug);
  const gasMetadata = useGasTokenMetadata();

  // const dispatch = useDispatch();
  // useEffect(() => {
  //   if (!isGasAsset(slug) && !tokenMetadata) {
  //     const [address, id = '0'] = slug.split('_');
  //     dispatch(loadTokenMetadataActions.submit({ address, id: Number(id) }));
  //   }
  // }, [slug, tokenMetadata]);

  if (isGasAsset(slug)) return gasMetadata;

  return tokenMetadata;
};

export function getAssetSymbol(metadata: AssetMetadataBase | nullish, short = false) {
  if (!metadata) return '???';
  if (!short) return metadata.symbol;
  return metadata.symbol === 'tez' ? 'ꜩ' : metadata.symbol.substr(0, 5);
}

export function getAssetName(metadata: AssetMetadataBase | nullish) {
  return metadata ? metadata.name : 'Unknown Token';
}

export const isCollectible = (metadata: AssetMetadataBase): metadata is TokenMetadata =>
  'artifactUri' in metadata && Boolean((metadata as TokenMetadata).artifactUri);
