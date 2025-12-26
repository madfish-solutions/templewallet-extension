import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { KNOWN_TOKENS_SLUGS } from 'lib/assets/known-tokens';
import { ETHERLINK_USDC_SLUG, APPLEFARM_REFERRAL_LINK, TEZOS_APY, APPLEFARM_APR, ETHEREUM_APR } from 'lib/constants';
import {
  ETHEREUM_HOODI_CHAIN_ID,
  ETHEREUM_MAINNET_CHAIN_ID,
  ETHERLINK_MAINNET_CHAIN_ID,
  TEZOS_GHOSTNET_CHAIN_ID,
  TEZOS_MAINNET_CHAIN_ID
} from 'lib/temple/types';
import { TempleChainKind } from 'temple/types';

import { YOUVES_REFFERAL_LINK } from './constants';
import { ReactComponent as AppleFarmIcon } from './icons/applefarm.svg';
import { ReactComponent as YouvesIcon } from './icons/youves.svg';
import { EarnOffer } from './types';

export const TEZ_SAVING_OFFER_ID = 'earn-tez';

export const getTezSavingOffer = (isTestnetMode: boolean) => {
  const chainId = isTestnetMode ? TEZOS_GHOSTNET_CHAIN_ID : TEZOS_MAINNET_CHAIN_ID;

  return {
    id: TEZ_SAVING_OFFER_ID,
    link: `/earn-tez/${chainId}`,
    symbol: 'TEZ',
    name: 'Delegation & Stake',
    chainKind: TempleChainKind.Tezos,
    chainId,
    assetSlug: TEZ_TOKEN_SLUG,
    displayYield: `${TEZOS_APY}% APY`
  };
};

export const ETH_SAVING_OFFER_ID = 'earn-eth';

export const getEthSavingOffer = (isTestnetMode: boolean) => {
  const chainId = isTestnetMode ? ETHEREUM_HOODI_CHAIN_ID : ETHEREUM_MAINNET_CHAIN_ID;

  return {
    id: ETH_SAVING_OFFER_ID,
    link: '/earn-eth',
    symbol: 'ETH',
    name: 'Everstake',
    chainKind: TempleChainKind.EVM,
    chainId,
    assetSlug: EVM_TOKEN_SLUG,
    displayYield: `${ETHEREUM_APR}% APR`
  };
};

const YOUVES_OFFER_COMMON_PROPERTIES = {
  name: 'Youves',
  link: YOUVES_REFFERAL_LINK,
  chainKind: TempleChainKind.Tezos,
  chainId: TEZOS_MAINNET_CHAIN_ID,
  providerIcon: YouvesIcon,
  isExternal: true
};

export const EXTERNAL_OFFERS: EarnOffer[] = [
  {
    id: 'youves-uusd',
    symbol: 'uUSD',
    assetSlug: KNOWN_TOKENS_SLUGS.UUSD,
    ...YOUVES_OFFER_COMMON_PROPERTIES
  },
  {
    id: 'youves-ubtc',
    symbol: 'uBTC',
    assetSlug: KNOWN_TOKENS_SLUGS.UBTC,
    ...YOUVES_OFFER_COMMON_PROPERTIES
  },
  {
    id: 'youves-you',
    symbol: 'YOU',
    assetSlug: KNOWN_TOKENS_SLUGS.YOU,
    ...YOUVES_OFFER_COMMON_PROPERTIES
  },
  {
    id: 'applefarm-usdc',
    link: APPLEFARM_REFERRAL_LINK,
    symbol: 'USDC',
    name: 'AppleFarm',
    chainKind: TempleChainKind.EVM,
    chainId: ETHERLINK_MAINNET_CHAIN_ID,
    assetSlug: ETHERLINK_USDC_SLUG,
    displayYield: `${APPLEFARM_APR}% APR`,
    providerIcon: AppleFarmIcon,
    isExternal: true
  }
];
