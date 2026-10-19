import {
  useEvmChainCollectiblesMetadataRecordSelector,
  useEvmCollectiblesMetadataRecordSelector
} from 'app/store/evm/collectibles-metadata/selectors';
import {
  useEvmChainNoCategoryAssetsMetadataSelector,
  useEvmNoCategoryAssetsMetadataRecordSelector
} from 'app/store/evm/no-category-assets-metadata/selectors';
import {
  use3RouteEvmChainTokensMetadataSelector,
  use3RouteEvmTokensMetadataRecordSelector
} from 'app/store/evm/swap-3route-metadata/selectors';
import {
  useLifiConnectedEvmChainTokensMetadataSelector,
  useLifiConnectedEvmTokensMetadataRecordSelector,
  useLifiEnabledNetworksEvmChainTokensMetadataSelector,
  useLifiEnabledNetworksEvmTokensMetadataRecordSelector
} from 'app/store/evm/swap-lifi-metadata/selectors';
import {
  useEvmChainTokensMetadataRecordSelector,
  useEvmTokensMetadataRecordSelector
} from 'app/store/evm/tokens-metadata/selectors';
import { usePartnersPromotionModule } from 'app/templates/partners-promotion';
import { useAdsConstantsModule } from 'lib/ads-constants';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { AccountToken } from 'lib/assets/hooks/tokens';
import { parseChainAssetSlug, toChainAssetSlug } from 'lib/assets/utils';
import type { EvmAssetMetadata } from 'lib/metadata/types';
import { isEvmCollectible } from 'lib/metadata/utils';
import { EvmChain, TezosChain } from 'temple/front/chains';
import { DEFAULT_EVM_CURRENCY, StoredEvmNetwork, StoredTezosNetwork } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

export type TokenListItemElement = HTMLDivElement | HTMLAnchorElement;

type EvmMetadataSlugRecord = StringRecord<unknown> | undefined;

// The virtual lists reserve a slot only for rows this allows: keep it equal to EvmTokenListItem's null branch
const evmTokenWillRender = (
  assetSlug: string,
  tokens: EvmMetadataSlugRecord,
  lifiConnected: EvmMetadataSlugRecord,
  lifiEnabled: EvmMetadataSlugRecord,
  route3: EvmMetadataSlugRecord,
  collectibles: EvmMetadataSlugRecord,
  noCategory: StringRecord<EvmAssetMetadata> | undefined
) => {
  if (assetSlug === EVM_TOKEN_SLUG) return true;

  if (tokens?.[assetSlug] || lifiConnected?.[assetSlug] || lifiEnabled?.[assetSlug] || route3?.[assetSlug]) return true;

  if (collectibles?.[assetSlug]) return false;

  const noCategoryMetadata = noCategory?.[assetSlug];

  return Boolean(noCategoryMetadata) && !isEvmCollectible(noCategoryMetadata);
};

export const useTokenWillBeRendered = () => {
  const lifiConnected = useLifiConnectedEvmTokensMetadataRecordSelector();
  const lifiEnabled = useLifiEnabledNetworksEvmTokensMetadataRecordSelector();
  const route3 = use3RouteEvmTokensMetadataRecordSelector();
  const tokens = useEvmTokensMetadataRecordSelector();
  const collectibles = useEvmCollectiblesMetadataRecordSelector();
  const noCategory = useEvmNoCategoryAssetsMetadataRecordSelector();

  return (chainSlug: string) => {
    const [chainKind, chainId, assetSlug] = parseChainAssetSlug(chainSlug);

    if (chainKind === TempleChainKind.Tezos) return true;

    const evmChainId = Number(chainId);

    return evmTokenWillRender(
      assetSlug,
      tokens[evmChainId],
      lifiConnected[evmChainId],
      lifiEnabled[evmChainId],
      route3[evmChainId],
      collectibles[evmChainId],
      noCategory[evmChainId]
    );
  };
};

export const useEvmChainTokenWillBeRendered = (chainId: number) => {
  const lifiConnected = useLifiConnectedEvmChainTokensMetadataSelector(chainId);
  const lifiEnabled = useLifiEnabledNetworksEvmChainTokensMetadataSelector(chainId);
  const route3 = use3RouteEvmChainTokensMetadataSelector(chainId);
  const tokens = useEvmChainTokensMetadataRecordSelector(chainId);
  const collectibles = useEvmChainCollectiblesMetadataRecordSelector(chainId);
  const noCategory = useEvmChainNoCategoryAssetsMetadataSelector(chainId);

  return (tokenSlug: string) =>
    evmTokenWillRender(tokenSlug, tokens, lifiConnected, lifiEnabled, route3, collectibles, noCategory);
};

export function makeFallbackChain(network: StoredTezosNetwork): TezosChain;
export function makeFallbackChain(network: StoredEvmNetwork): EvmChain;
export function makeFallbackChain(network: StoredEvmNetwork | StoredTezosNetwork): EvmChain | TezosChain {
  const { name, rpcBaseURL } = network;
  const commonProps = {
    name,
    rpcBaseURL,
    allBlockExplorers: [],
    default: true
  };

  if (network.chain === TempleChainKind.EVM) {
    const { chain, chainId } = network;

    return { ...commonProps, rpc: network, allRpcs: [network], kind: chain, chainId, currency: DEFAULT_EVM_CURRENCY };
  }

  const { chain, chainId } = network;

  return { ...commonProps, rpc: network, allRpcs: [network], kind: chain, chainId };
}

export const useRenderPromo = (manageActive: boolean, page: 'home' | 'tokens') => {
  const PartnersPromotionModule = usePartnersPromotionModule();
  const AdsConstantsModule = useAdsConstantsModule();
  const id = page === 'home' ? 'promo-token-item' : 'promo-token-item-tokens';

  return () =>
    manageActive || !PartnersPromotionModule || !AdsConstantsModule ? null : (
      <PartnersPromotionModule.PartnersPromotion
        id={id}
        key={id}
        variant={PartnersPromotionModule.PartnersPromotionVariant.Text}
        pageName={page === 'home' ? AdsConstantsModule.HOME_PAGE_NAME : AdsConstantsModule.TOKENS_PAGE_NAME}
      />
    );
};

export const toNotRemovedChainTokensSlugs = (tokens: AccountToken[], chainKind: TempleChainKind) =>
  tokens
    .filter(({ status }) => status !== 'removed')
    .map(({ chainId, slug }) => toChainAssetSlug(chainKind, chainId, slug));
