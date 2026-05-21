import { Ref } from 'react';

import { usePartnersPromotionModule } from 'app/templates/partners-promotion';
import { useAdsConstantsModule } from 'lib/ads-constants';
import { AccountToken } from 'lib/assets/hooks/tokens';
import { toChainAssetSlug } from 'lib/assets/utils';
import { EvmChain, TezosChain } from 'temple/front';
import { DEFAULT_EVM_CURRENCY, StoredEvmNetwork, StoredTezosNetwork } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

export const toExploreAssetLink = (
  isCollectible: boolean,
  chainKind: TempleChainKind,
  chainId: number | string,
  assetSlug: string
) => `/${isCollectible ? 'collectible' : 'token'}/${chainKind}/${chainId}/${assetSlug}`;

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

export const useRenderPromo = (manageActive: boolean, promoRef?: Ref<HTMLDivElement>) => {
  const PartnersPromotionModule = usePartnersPromotionModule();
  const AdsConstantsModule = useAdsConstantsModule();

  return () =>
    manageActive || !PartnersPromotionModule || !AdsConstantsModule ? null : (
      <PartnersPromotionModule.PartnersPromotion
        id="promo-token-item"
        key="promo-token-item"
        variant={PartnersPromotionModule.PartnersPromotionVariant.Text}
        pageName={AdsConstantsModule.HOME_PAGE_NAME}
        ref={promoRef}
      />
    );
};

export const toNotRemovedChainTokensSlugs = (tokens: AccountToken[], chainKind: TempleChainKind) =>
  tokens
    .filter(({ status }) => status !== 'removed')
    .map(({ chainId, slug }) => toChainAssetSlug(chainKind, chainId, slug));
