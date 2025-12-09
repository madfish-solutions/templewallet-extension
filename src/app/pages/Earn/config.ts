import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { KNOWN_TOKENS_SLUGS } from 'lib/assets/known-tokens';
import { ETHERLINK_USDC_SLUG, APPLEFARM_REFERRAL_LINK } from 'lib/constants';
import { COMMON_MAINNET_CHAIN_IDS, ETHEREUM_MAINNET_CHAIN_ID, TEZOS_MAINNET_CHAIN_ID } from 'lib/temple/types';
import { TempleChainKind } from 'temple/types';

import { YOUVES_REFFERAL_LINK } from './constants';
import { ReactComponent as AppleFarmIcon } from './icons/applefarm.svg';
import { ReactComponent as YouvesIcon } from './icons/youves.svg';
import { EarnOffer } from './types';

export const TEZ_SAVING_OFFER: EarnOffer = {
  id: 'earn-tez',
  link: `/earn-tez/${TEZOS_MAINNET_CHAIN_ID}`,
  name: 'TEZ',
  description: 'Delegation & Stake',
  chainKind: TempleChainKind.Tezos,
  chainId: TEZOS_MAINNET_CHAIN_ID,
  assetSlug: TEZ_TOKEN_SLUG,
  displayYield: '6.5% APY'
};

export const ETH_SAVING_OFFER: EarnOffer = {
  id: 'earn-eth',
  link: '/earn-eth',
  name: 'ETH',
  description: 'Everstake',
  chainKind: TempleChainKind.EVM,
  chainId: ETHEREUM_MAINNET_CHAIN_ID,
  assetSlug: EVM_TOKEN_SLUG,
  displayYield: '3.4-10% APR'
};

export const SAVINGS_OFFERS: EarnOffer[] = [TEZ_SAVING_OFFER, ETH_SAVING_OFFER];

export const EXTERNAL_OFFERS: EarnOffer[] = [
  {
    id: 'youves-uusd',
    link: YOUVES_REFFERAL_LINK,
    name: 'uUSD',
    description: 'Youves',
    chainKind: TempleChainKind.Tezos,
    chainId: TEZOS_MAINNET_CHAIN_ID,
    assetSlug: KNOWN_TOKENS_SLUGS.UUSD,
    providerIcon: YouvesIcon,
    isExternal: true
  },
  {
    id: 'youves-ubtc',
    link: YOUVES_REFFERAL_LINK,
    name: 'uBTC',
    description: 'Youves',
    chainKind: TempleChainKind.Tezos,
    chainId: TEZOS_MAINNET_CHAIN_ID,
    assetSlug: KNOWN_TOKENS_SLUGS.UBTC,
    providerIcon: YouvesIcon,
    isExternal: true
  },
  {
    id: 'youves-you',
    link: YOUVES_REFFERAL_LINK,
    name: 'YOU',
    description: 'Youves',
    chainKind: TempleChainKind.Tezos,
    chainId: TEZOS_MAINNET_CHAIN_ID,
    assetSlug: KNOWN_TOKENS_SLUGS.YOU,
    providerIcon: YouvesIcon,
    isExternal: true
  },
  {
    id: 'applefarm-usdc',
    link: APPLEFARM_REFERRAL_LINK,
    name: 'USDC',
    description: 'AppleFarm',
    chainKind: TempleChainKind.EVM,
    chainId: COMMON_MAINNET_CHAIN_IDS.etherlink,
    assetSlug: ETHERLINK_USDC_SLUG,
    displayYield: '28% APR',
    providerIcon: AppleFarmIcon,
    isExternal: true
  }
];
