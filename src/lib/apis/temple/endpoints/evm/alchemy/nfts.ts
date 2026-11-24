/** Types, taken from Alchemy SDK */

import { NftContract, NftImage, NftTokenType } from './nft-contracts';

interface OwnedNftsValidAt {
  /** The block number the sale information is valid at. */
  blockNumber?: number;
  /** The block hash. Used to detect reorgs. */
  blockHash: string;
  /** The timestamp for the block. */
  blockTimestamp?: string;
}

interface BaseNft {
  /** The contract address of the NFT. */
  contractAddress: string;
  /** The NFT token ID as an integer string. */
  tokenId: string;
}

enum NftSpamClassification {
  Erc721TooManyOwners = 'Erc721TooManyOwners',
  Erc721TooManyTokens = 'Erc721TooManyTokens',
  Erc721DishonestTotalSupply = 'Erc721DishonestTotalSupply',
  MostlyHoneyPotOwners = 'MostlyHoneyPotOwners',
  OwnedByMostHoneyPots = 'OwnedByMostHoneyPots',
  LowDistinctOwnersPercent = 'LowDistinctOwnersPercent',
  HighHoneyPotOwnerPercent = 'HighHoneyPotOwnerPercent',
  HighHoneyPotPercent = 'HighHoneyPotPercent',
  HoneyPotsOwnMultipleTokens = 'HoneyPotsOwnMultipleTokens',
  NoSalesActivity = 'NoSalesActivity',
  HighAirdropPercent = 'HighAirdropPercent',
  Unknown = 'Unknown'
}

interface NftContractForNft extends NftContract {
  /** Whether the NFT contract is marked as spam. */
  isSpam?: boolean;
  /** Potential reasons why an NFT Contract was classified as spam. */
  spamClassifications: NftSpamClassification[];
}

interface NftRawMetadata {
  /** The raw token URI on the NFT contract. */
  tokenUri?: string;
  /** The raw metadata parsed from the raw token URI. */
  metadata: Record<string, any>;
  /** Error message if the raw metadata could not be fetched. */
  error?: string;
}

interface AcquiredAt {
  /** Timestamp of the block at which an NFT was last acquired. */
  blockTimestamp?: string;
  /** Block number of the block at which an NFT was last acquired. */
  blockNumber?: number;
}

interface BaseNftCollection {
  /** The name of the collection. */
  name: string;
  /** The OpenSea human-readable slug of the collection. */
  slug?: string;
  /** The external URL for the collection. */
  externalUrl?: string;
  /** The banner image URL for the collection. */
  bannerImageUrl?: string;
}

interface NftMint {
  /** The address that the NFT was minted to. */
  mintAddress?: string;
  /** The block number that the NFT was minted on. */
  blockNumber?: number;
  /** The timestamp the NFT was minted on. */
  timestamp?: string;
  /** The transaction hash of the transaction that minted the NFT. */
  transactionHash?: string;
}

interface Nft {
  /** The NFT's underlying contract and relevant contract metadata. */
  contract: NftContractForNft;
  /** The NFT token ID as an integer string. */
  tokenId: string;
  /** The type of NFT.*/
  tokenType: NftTokenType;
  /** The NFT name. */
  name?: string;
  /** The NFT description. */
  description?: string;
  /** Media URLs and information for the NFT */
  image: NftImage;
  /** Animation information for the NFT. */
  animation?: {
    /** URL of the animation stored in Alchemy's cache. */
    cachedUrl?: string;
    /** The original URL of the animation as stored on the contract. */
    originalUrl?: string;
    /** The type of the animation media. */
    contentType?: string;
    /** The size of the animation in bytes. */
    size?: number;
  };
  /** The raw metadata for the NFT based on the metadata URI on the NFT contract. */
  raw: NftRawMetadata;
  /** URIs for accessing the NFT's metadata blob. */
  tokenUri?: string;
  /** When the NFT was last updated in the blockchain. Represented in ISO-8601 format. */
  timeLastUpdated: string;
  /**
   * Time at which the NFT was most recently acquired by the user. Only
   * available when specifying `orderBy: NftOrdering.TRANSFERTIME` in the
   * request.
   */
  acquiredAt?: AcquiredAt;
  /** Collection metadata for the NFT, if available. */
  collection?: BaseNftCollection;
  /** Mint information for the NFT. */
  mint?: NftMint;
}

interface OwnedBaseNft extends BaseNft {
  /** The token balance of the NFT. */
  balance: string;
}

interface OwnedNft extends Nft {
  /** The token balance of the NFT. */
  balance: string;
}

interface SomeNftsResponseBase<T> {
  /** The NFTs owned by the provided address that match the query. */
  ownedNfts: T[];
  /**
   * Pagination token that can be passed into another request to fetch the next
   * NFTs. If there is no page key, then there are no more NFTs to fetch.
   */
  pageKey?: string;
  /** The total count of NFTs owned by the provided address that match the query. */
  totalCount: number;
  /**
   * Block Information of the block as of which the corresponding data is valid
   */
  validAt: OwnedNftsValidAt;
}

export type BaseNftsResponse = SomeNftsResponseBase<OwnedBaseNft>;
export type NftsResponse = SomeNftsResponseBase<OwnedNft>;
export type SomeNftsResponse = BaseNftsResponse | NftsResponse;

type AlchemyNftFilter = 'SPAM' | 'AIRDROPS';
type AlchemyNftOrdering = 'TRANSFERTIME';
type AlchemyNftSpamConfidenceLevel = 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';

/** Query filters shared by Alchemy's owner-contract and owner-NFT routes. */
export interface AlchemyNftQueryFilters {
  orderBy?: AlchemyNftOrdering;
  excludeFilters?: AlchemyNftFilter[];
  includeFilters?: AlchemyNftFilter[];
  spamConfidenceLevel?: AlchemyNftSpamConfidenceLevel;
}

/** Passed on inventory requests. Omit it, or pass another value, to show spam. */
export const ALCHEMY_NFT_EXCLUDE_SPAM: AlchemyNftQueryFilters = { excludeFilters: ['SPAM'] };
