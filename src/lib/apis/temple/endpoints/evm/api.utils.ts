import { GoldrushChainID, GoldrushChainIDs } from './api.interfaces';

export const DEFAULT_NATIVE_TOKEN_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

const chainIdNativeTokenAddressRecord: Record<number, string> = {
  // Polygon Mainnet
  137: '0x0000000000000000000000000000000000001010',
  /** Polygon Testnet
   * @deprecated https://www.alchemy.com/blog/polygon-mumbai-testnet-deprecation
   */
  80001: '0x0000000000000000000000000000000000001010'
};

export const isNativeTokenAddress = (chainId: number, address: string) =>
  address === (chainIdNativeTokenAddressRecord[chainId] ?? DEFAULT_NATIVE_TOKEN_ADDRESS);

const GOLDRUSH_CHAIN_IDS = new Set<number>(GoldrushChainIDs);

export const isGoldrushChainId = (chainId: number): chainId is GoldrushChainID => GOLDRUSH_CHAIN_IDS.has(chainId);
