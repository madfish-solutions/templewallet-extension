export type { Chain as ViemChain } from 'viem/chains';

export interface AddNetworkFormValues {
  name: string;
  rpcUrl: string;
  chainId: string;
  symbol: string;
  explorerUrl: string;
  testnet: boolean;
}
