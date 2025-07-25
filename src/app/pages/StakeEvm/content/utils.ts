import { getAssets } from '@temple-wallet/everstake-wallet-sdk';

export const getStakingAPR = (chain: 'polygon' | 'ethereum'): Promise<number> =>
  getAssets(chain).then(({ blockchain }) => blockchain.apr ?? 0);
