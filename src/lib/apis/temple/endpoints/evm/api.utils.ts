import { ChainID, ChainIDs } from './api.interfaces';

export const isSupportedChainId = (chainId: number): chainId is ChainID => ChainIDs.includes(chainId);
