export * from './history';
export type { GetContractsForOwnerResponse } from './nft-contracts';
export type { BaseNftsResponse, NftsResponse, SomeNftsResponse, AlchemyNftQueryFilters } from './nfts';
export { ALCHEMY_NFT_EXCLUDE_SPAM } from './nfts';

export const AlchemyChainIDs = [
  1, 10, 30, 31, 56, 97, 100, 130, 137, 143, 204, 300, 324, 360, 480, 592, 747, 988, 999, 1088, 1101, 1329, 1514, 1868,
  1946, 2020, 2442, 2741, 4326, 4663, 4801, 5000, 5003, 5042, 5611, 7000, 7001, 8453, 10200, 11011, 33139, 42161, 42220,
  43113, 43114, 44787, 46630, 57073, 59141, 59144, 69000, 80002, 80094, 81457, 84532, 421614, 534352, 685685, 7777777,
  11155111, 11155420, 11155931, 168587773
] as const;

export type AlchemyChainID = (typeof AlchemyChainIDs)[number];
