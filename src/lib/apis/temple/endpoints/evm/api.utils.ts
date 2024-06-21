import { ChainID, ChainIDs } from './api.interfaces';

export const NATIVE_TOKEN_INDEX = 0;

export const isSupportedChainId = (chainId: number): chainId is ChainID => ChainIDs.includes(chainId);
