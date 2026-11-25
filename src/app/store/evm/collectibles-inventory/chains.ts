import { AlchemyChainID, AlchemyChainIDs } from 'lib/apis/temple/endpoints/evm/alchemy';
import { OpenseaChainID, OpenseaChainIDs } from 'lib/apis/temple/endpoints/evm/opensea';

const ALCHEMY_CHAIN_IDS = new Set<number>(AlchemyChainIDs);
const OPENSEA_CHAIN_IDS = new Set<number>(OpenseaChainIDs);

export const isAlchemyChainId = (chainId: number): chainId is AlchemyChainID => ALCHEMY_CHAIN_IDS.has(chainId);

export const isOpenseaChainId = (chainId: number): chainId is OpenseaChainID => OPENSEA_CHAIN_IDS.has(chainId);

export const isAlchemyOpenseaChainId = (chainId: number): chainId is AlchemyChainID & OpenseaChainID =>
  isAlchemyChainId(chainId) && isOpenseaChainId(chainId);
