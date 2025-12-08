import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { ETHERLINK_USDC_SLUG, KNOWN_TOKENS_SLUGS } from 'lib/assets/known-tokens';
import { COMMON_MAINNET_CHAIN_IDS, ETHEREUM_MAINNET_CHAIN_ID, TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { ChainId } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

import { ReactComponent as AppleFarmIcon } from './icons/applefarm.svg';
import { ReactComponent as YouvesIcon } from './icons/youves.svg';

export interface EarnOffer {
  id: string;
  link: string;
  name: string;
  description: string;
  type: 'saving' | 'external';
  chainKind: TempleChainKind;
  chainId: ChainId<TempleChainKind>;
  assetSlug: string;
  displayYield?: string;
  providerIcon?: ImportedSVGComponent;
  isExternal?: boolean;
}

export const TEZ_SAVING_OFFER: EarnOffer = {
  id: 'earn-tez',
  link: `/earn-tez/${TEZOS_MAINNET_CHAIN_ID}`,
  name: 'TEZ',
  description: 'Delegation & Stake',
  type: 'saving',
  chainKind: TempleChainKind.Tezos,
  chainId: TEZOS_MAINNET_CHAIN_ID,
  assetSlug: TEZ_TOKEN_SLUG,
  displayYield: '6.5% APY'
};

export const ETH_SAVING_OFFER: EarnOffer = {
  id: 'earn-eth',
  link: `/earn-tez/${TEZOS_MAINNET_CHAIN_ID}`,
  name: 'ETH',
  description: 'Everstake',
  type: 'saving',
  chainKind: TempleChainKind.EVM,
  chainId: ETHEREUM_MAINNET_CHAIN_ID,
  assetSlug: EVM_TOKEN_SLUG,
  displayYield: '3.4-10% APR'
};

export const EARN_OFFERS: EarnOffer[] = [
  {
    id: 'youves-uusd',
    link: 'https://app.youves.com/earn',
    name: 'uUSD',
    description: 'Youves',
    type: 'external',
    chainKind: TempleChainKind.Tezos,
    chainId: TEZOS_MAINNET_CHAIN_ID,
    assetSlug: KNOWN_TOKENS_SLUGS.UUSD,
    providerIcon: YouvesIcon,
    isExternal: true
  },
  {
    id: 'youves-ubtc',
    link: 'https://app.youves.com/earn',
    name: 'uBTC',
    description: 'Youves',
    type: 'external',
    chainKind: TempleChainKind.Tezos,
    chainId: TEZOS_MAINNET_CHAIN_ID,
    assetSlug: KNOWN_TOKENS_SLUGS.UBTC,
    providerIcon: YouvesIcon,
    isExternal: true
  },
  {
    id: 'youves-you',
    link: 'https://app.youves.com/earn',
    name: 'YOU',
    description: 'Youves',
    type: 'external',
    chainKind: TempleChainKind.Tezos,
    chainId: TEZOS_MAINNET_CHAIN_ID,
    assetSlug: KNOWN_TOKENS_SLUGS.YOU,
    providerIcon: YouvesIcon,
    isExternal: true
  },
  {
    id: 'applefarm-usdc',
    link: 'https://app.applefarm.xyz/referral?code=APPLE-FARM-880788',
    name: 'USDC',
    description: 'AppleFarm',
    type: 'external',
    chainKind: TempleChainKind.EVM,
    chainId: COMMON_MAINNET_CHAIN_IDS.etherlink,
    assetSlug: ETHERLINK_USDC_SLUG,
    displayYield: '28% APR',
    providerIcon: AppleFarmIcon,
    isExternal: true
  }
];
