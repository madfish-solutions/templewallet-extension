import ethCoinAnimation from './eth-coin-animation.json';

export const EVERSTAKE_ETHEREUM_STAKE_UTM_LINK =
  'https://stake.everstake.one/dashboard/stake/ethereum/?utm_source=Temple_Wallet&utm_medium=partner&utm_campaign=Temple_Wallet_campaign_Q3-25';

export const ETH_COIN_ANIMATION_OPTIONS = {
  loop: true,
  autoplay: true,
  animationData: ethCoinAnimation,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice'
  }
};
