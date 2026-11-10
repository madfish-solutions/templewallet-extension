export const OpenseaChainIDs = [
  1, 137, 8453, 81457, 42161, 43114, 10, 7777777, 1329, 8333, 80094, 33139, 747, 2020, 2741, 360, 130, 43419, 999, 5031,
  143, 4326, 1868, 69000, 57073, 4663, 988, 5042
] as const;

export type OpenseaChainID = (typeof OpenseaChainIDs)[number];

export interface OpenseaNftRef {
  chainId: OpenseaChainID;
  contractAddress: string;
  tokenId: string;
}

export interface OpenseaNftDetailed {
  identifier: string;
  collection: string;
  contract: string;
  tokenStandard: string;
  name?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  displayImageUrl?: string | null;
  displayAnimationUrl?: string | null;
  metadataUrl?: string | null;
  openseaUrl: string;
  updatedAt: string;
  isDisabled: boolean;
  isNsfw: boolean;
  originalImageUrl?: string | null;
  originalAnimationUrl?: string | null;
  traits: Array<{
    traitType: string;
    displayType?: string | null;
    maxValue?: string | null;
    value: unknown;
  }>;
  /** Format: double */
  estimatedValueUsd?: number | null;
  /** Format: int32 */
  decimals?: number | null;
  animationUrl?: string | null;
  isSuspicious?: boolean;
  creator?: string;
  owners?: Array<{
    address: string;
    quantity: number;
    quantityString: string;
  }>;
  rarity?: {
    strategyId: string;
    strategyVersion: string;
    rank?: number | null;
  } | null;
  subscription?: {
    expiresAt?: number | null;
    isRenewable: boolean;
    isExpired: boolean;
  } | null;
}

export interface OpenseaProfileCollectionResponse {
  collection: string;
  name: string;
  description?: string | null;
  /** @description Square avatar for the collection, used wherever it is named. Falls back to a representative item's image when the collection has none of its own. */
  imageUrl?: string | null;
  /** @description Wide image for the collection, and the only wide image on this API. Use it for a header or hero slot; image_url is square and will not fill one. On the single-collection endpoint it is the collection's hero image, else its hero video's poster, else its banner; on list endpoints it is the banner. Always a still image: a video gets a frame from it, or null when no still can be derived. */
  bannerImageUrl?: string | null;
  owner?: string | null;
  safelistStatus: string;
  category?: string | null;
  isDisabled: boolean;
  isNsfw: boolean;
  traitOffersEnabled: boolean;
  collectionOffersEnabled: boolean;
  openseaUrl: string;
  projectUrl?: string | null;
  wikiUrl?: string | null;
  discordUrl?: string | null;
  telegramUrl?: string | null;
  twitterUsername?: string | null;
  instagramUsername?: string | null;
  contracts: Array<{ address: string; chain: string }>;
  /**
   * Distinct NFTs this account owns in the collection.
   * This is not the collection's total supply.
   */
  itemCount: number;
  /**
   * Quantity this account owns. Greater than `itemCount` when an ERC-1155 balance is greater than 1.
   */
  totalQuantity: number;
  /** Format: double */
  usdValue?: number | null;
}

interface OpenseaSearchResultBase {
  type: 'collection' | 'nft' | 'token' | 'account';
}

interface CollectionSearchResult extends OpenseaSearchResultBase {
  type: 'collection';
  collection: {
    /**
     * @description The collection slug
     * @example bored-ape-yacht-club
     */
    collection: string;
    /**
     * @description The collection name
     * @example Bored Ape Yacht Club
     */
    name: string;
    /** @description URL of the collection image */
    imageUrl?: string | null;
    /** @description Whether trading is disabled for this collection */
    isDisabled: boolean;
    /** @description Whether this collection is marked as NSFW */
    isNsfw: boolean;
    /** @description URL to the collection on OpenSea */
    openseaUrl: string;
  };
}

interface NftSearchBestListingResponse {
  /**
   * @description Price for one unit, in whole units of the payment currency
   * @example 0.25
   */
  price: string;
  /**
   * @description Symbol of the payment currency. Null when the currency could not be resolved.
   * @example ETH
   */
  currency?: string | null;
  /**
   * @description Contract address of the payment currency
   * @example 0x0000000000000000000000000000000000000000
   */
  currencyAddress: string;
  /**
   * @description Price for one unit in USD. Null when the currency has no USD price.
   * @example 812.5
   */
  priceUsd?: string | null;
}

interface NftSearchResult extends OpenseaSearchResultBase {
  type: 'nft';
  nft: {
    /**
     * @description Token ID of the NFT
     * @example 1234
     */
    identifier: string;
    /**
     * @description Collection slug the NFT belongs to
     * @example bored-ape-yacht-club
     */
    collection: string;
    /** @description Contract address of the NFT */
    contract: string;
    /** @description Name of the NFT */
    name?: string | null;
    /** @description URL of the NFT image */
    imageUrl?: string | null;
    /** @description URL to the NFT on OpenSea */
    openseaUrl: string;
    /** @description Cheapest listing for one unit of this NFT that can be filled through this API (OpenSea listings; other marketplaces are excluded). Null when there is none. */
    bestListing?: NftSearchBestListingResponse | null;
  };
}

interface TokenSearchResult extends OpenseaSearchResultBase {
  type: 'token';
  token: {
    /**
     * @description The contract address of the token
     * @example 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
     */
    address: string;
    /**
     * @description The blockchain the token is on
     * @example ethereum
     */
    chain: string;
    /**
     * @description The display name of the token
     * @example USDC
     */
    name: string;
    /**
     * @description The ticker symbol of the token
     * @example USDC
     */
    symbol: string;
    /** @description URL of the token's image */
    imageUrl?: string | null;
    /**
     * @description Current price in USD
     * @example 1.0
     */
    usdPrice: string;
    /**
     * Format: int32
     * @description Number of decimal places
     * @example 6
     */
    decimals: number;
    /** @description URL to the token page on OpenSea */
    openseaUrl: string;
  };
}

interface AccountSearchResult extends OpenseaSearchResultBase {
  type: 'account';
  account: {
    /** @description Primary wallet address of the account */
    address: string;
    /** @description Username of the account */
    username?: string | null;
    /** @description URL of the account's profile image */
    profileImageUrl?: string | null;
    /** @description URL to the account on OpenSea */
    openseaUrl: string;
  };
}

export type OpenseaSearchResult = CollectionSearchResult | NftSearchResult | TokenSearchResult | AccountSearchResult;
