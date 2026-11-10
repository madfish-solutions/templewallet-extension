/** Types, taken from Alchemy SDK */

interface DisplayNftForContract {
  /** A token id of an NFT owned by the owner on the contract. */
  tokenId: string;
  /** The name of the NFT, if available. */
  name?: string;
}

export interface NftImage {
  /** URL of the image stored in Alchemy's cache. */
  cachedUrl?: string;
  /** URL of a thumbnail sized image. */
  thumbnailUrl?: string;
  /** URL of the image in png format */
  pngUrl?: string;
  /** The type of the media image. */
  contentType?: string;
  /** The size of the media asset in bytes. */
  size?: number;
  /** The original URL of the image as stored on the contract. */
  originalUrl?: string;
}

export enum NftTokenType {
  ERC721 = 'ERC721',
  ERC1155 = 'ERC1155',
  NO_SUPPORTED_NFT_STANDARD = 'NO_SUPPORTED_NFT_STANDARD',
  NOT_A_CONTRACT = 'NOT_A_CONTRACT',
  UNKNOWN = 'UNKNOWN'
}

enum OpenSeaSafelistRequestStatus {
  /** Verified collection. */
  VERIFIED = 'verified',
  /** Collections that are approved on open sea and can be found in search results. */
  APPROVED = 'approved',
  /** Collections that requested safelisting on OpenSea. */
  REQUESTED = 'requested',
  /** Brand new collections. */
  NOT_REQUESTED = 'not_requested'
}

interface OpenSeaCollectionMetadata {
  /** The floor price of the collection. */
  floorPrice?: number;
  /** The name of the collection on OpenSea. */
  collectionName?: string;
  /** The slug of the collection on OpenSea. */
  collectionSlug?: string;
  /** The approval status of the collection on OpenSea. */
  safelistRequestStatus?: OpenSeaSafelistRequestStatus;
  /** The image URL determined by OpenSea. */
  imageUrl?: string;
  /**
   * The banner image URL determined by OpenSea.
   * @deprecated Use {@link bannerImageUrl} instead.
   */
  imageBannerUrl?: string;
  /** The banner image URL determined by OpenSea. */
  bannerImageUrl?: string;
  /** The description of the collection on OpenSea. */
  description?: string;
  /** The homepage of the collection as determined by OpenSea. */
  externalUrl?: string;
  /** The Twitter handle of the collection. */
  twitterUsername?: string;
  /** The Discord URL of the collection. */
  discordUrl?: string;
  /** Timestamp of when the OpenSea metadata was last ingested by Alchemy. */
  lastIngestedAt: string;
}

export interface NftContract {
  /** The address of the NFT contract. */
  address: string;
  /** The type of the token in the contract. */
  tokenType: NftTokenType;
  /** The name of the contract. */
  name?: string;
  /** The symbol of the contract. */
  symbol?: string;
  /**
   * The number of NFTs in the contract as an integer string. This field is only
   * available on ERC-721 contracts.
   */
  totalSupply?: string;
  /** OpenSea's metadata for the contract. */
  openSeaMetadata: OpenSeaCollectionMetadata;
  /** The address that deployed the NFT contract. */
  contractDeployer?: string;
  /** The block number the NFT contract deployed in. */
  deployedBlockNumber?: number;
}

interface NftContractForOwner extends NftContract {
  /**
   * Sum of NFT balances across all token IDs held by the owner. For
   * non-fungible tokens this will be equal to the numDistinctTokensOwned, but
   * it may be higher if the user holds some fungible ERC1155 tokens.
   */
  totalBalance: string;
  /**
   * Number of distinct token IDs held by the owner. For non-fungible tokens
   * this will be equal to the totalBalance, but it may be lower if the user
   * holds some fungible ERC1155 tokens.
   */
  numDistinctTokensOwned: string;
  /** Whether the NFT contract is considered spam. */
  isSpam: boolean;
  /**
   * Object containing an NFT owned by the owner for this particular contract.
   * Use this to display a sample NFT for the contract.
   */
  displayNft: DisplayNftForContract;
  /** Object containing different URLs for the NFT media. */
  image: NftImage;
}

export interface GetContractsForOwnerResponse {
  /** The list of contracts, that match the query, held by the given address. */
  contracts: NftContractForOwner[];
  /** Key for pagination to use to fetch results from the next page if available. */
  pageKey?: string;
  /** Total number of NFT contracts held by the given address that match the query. */
  totalCount: number;
}
