import { ChainID, ChainIDs } from './api.interfaces';

const DEFAULT_NATIVE_TOKEN_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';

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

export const isSupportedChainId = (chainId: number): chainId is ChainID =>
  ChainIDs.includes(
    // @ts-expect-error
    chainId
  );
