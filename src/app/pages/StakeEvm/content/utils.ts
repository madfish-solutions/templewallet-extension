import { GetAssets } from '@temple-wallet/everstake-wallet-sdk';

export const getStakingAPR = (chain: 'polygon' | 'ethereum'): Promise<number> =>
  GetAssets(chain).then(({ blockchain }) => blockchain.apr ?? 0);
