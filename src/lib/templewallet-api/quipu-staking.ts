import axios from 'axios';

const QUIPU_BASE_URL = 'https://quipuswap-staking-api-mainnet.production.madservice.xyz/';

interface QuipuswapTokenMetadata {
  contractAddress: string;
  fa2TokenId?: string;
  isWhitelisted: boolean;
  metadata: {
    decimals: number;
    is_boolean_amount?: string;
    is_transferable?: string;
    name: string;
    should_prefer_symbol?: string;
    symbol: string;
    thumbnailUri?: string;
    token_id?: string;
  };
  type: 'FA2' | 'FA12';
}

interface QuipuswapStakingInfoResponse {
  item?: {
    apr: number;
    apy: number;
    currentDelegate: string;
    depositExchangeRate: string;
    depositTokenUrl: string;
    earnExchangeRate: string;
    endTime: string;
    harvestFee: string;
    id: string;
    nextDelegate: string;
    rewardPerSecond: string;
    rewardPerShare: string;
    rewardToken: QuipuswapTokenMetadata;
    stakeStatus: string;
    stakeUrl: string;
    staked: string;
    stakedToken: QuipuswapTokenMetadata;
    timelock: string;
    tokenA: QuipuswapTokenMetadata;
    tvlInStakedToken: string;
    tvlInUsd: string;
    udp: string;
    withdrawalFee: string;
  };
  blockInfo: {
    hash: string;
    level: number;
    timestamp: string;
  };
}

const api = axios.create({ baseURL: QUIPU_BASE_URL });

export async function getQuipuStakingInfo(): Promise<QuipuswapStakingInfoResponse> {
  return api.get('/list/3').then(r => r.data);
}
