import { TEZ_TOKEN_SLUG } from 'lib/assets';
import { EVM_TOKEN_SLUG } from 'lib/assets/defaults';
import { TEZOS_APY, ETHEREUM_APR } from 'lib/constants';
import {
  ETHEREUM_HOODI_CHAIN_ID,
  ETHEREUM_MAINNET_CHAIN_ID,
  TEZOS_SHADOWNET_CHAIN_ID,
  TEZOS_MAINNET_CHAIN_ID
} from 'lib/temple/types';
import { TempleChainKind } from 'temple/types';

export const TEZ_SAVING_OFFER_ID = 'earn-tez';

export const getTezSavingOffer = (isTestnetMode: boolean) => {
  const chainId = isTestnetMode ? TEZOS_SHADOWNET_CHAIN_ID : TEZOS_MAINNET_CHAIN_ID;

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
