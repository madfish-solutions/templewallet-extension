export const ChainIDs = [
  20090103, 1, 137, 56, 43114, 10, 250, 1284, 1285, 42161, 2020, 25, 42262, 5, 43113, 97, 1287, 4002, 1399811149, 42170,
  7700, 416, 23294, 11155111, 999, 8453, 5000, 59144, 324, 100, 10200, 11155420, 204, 534352, 17000, 88, 421614, 560048,
  42220, 388, 143, 80094, 9745, 130, 9746, 59141, 80002, 36900, 690, 1329, 33139, 1301, 146, 480, 4801, 37111, 763373,
  57073, 232, 7000, 167000, 81457, 5
] as const;

export type ChainID = (typeof ChainIDs)[number];

export interface BalancesResponse {
  /** * The requested address. */
  address: string;
  /** * The requested chain ID eg: `1`. */
  chain_id: ChainID;
  /** * The requested chain name eg: `eth-mainnet`. */
  chain_name: string;
  /** * The requested quote currency eg: `USD`. */
  quote_currency: string;
  /** * The timestamp when the response was generated. Useful to show data staleness to users. */
  updated_at: string;
  /** * The timestamp of the latest signed block at the time this response was provided. */
  chain_tip_signed_at?: string;
  /** * List of response items. */
  items: BalanceItem[];
}

export interface RouteParams {
  fromChain: number;
  toChain: number;
  fromToken: string;
  toToken: string;
  amount: string;
  fromAddress: string;
  slippage: number;
  amountForGas?: string;
}

export interface BalanceItem {
  /** * Use contract decimals to format the token balance for display purposes - divide the balance by `10^{contract_decimals}`. */
  contract_decimals: number | null;
  /** * The string returned by the `name()` method. */
  contract_name: string | null;
  /** * The ticker symbol for this contract. This field is set by a developer and non-unique across a network. */
  contract_ticker_symbol: string | null;
  /** * Use the relevant `contract_address` to lookup prices, logos, token transfers, etc. */
  contract_address: string;
  /** * A display-friendly name for the contract. */
  contract_display_name: string | null;
  /** * A list of supported standard ERC interfaces, eg: `ERC20` and `ERC721`. */
  supports_erc: string[];
  /** * The contract logo URL. */
  logo_url: string;
  /** * The contract logo URLs. */
  logo_urls: LogoUrls;
  /** * The timestamp when the token was transferred. */
  last_transferred_at: Date;
  /** * Indicates if a token is the chain's native gas token, eg: ETH on Ethereum. */
  native_token: boolean;
  /** * One of `cryptocurrency`, `stablecoin`, `nft` or `dust`. */
  type: string;
  /** * Denotes whether the token is suspected spam. */
  is_spam: boolean;
  /** * The asset balance. Use `contract_decimals` to scale this balance for display purposes. */
  balance: string | null;
  /** * The 24h asset balance. Use `contract_decimals` to scale this balance for display purposes. */
  balance_24h: string | null;
  /** * The exchange rate for the requested quote currency. */
  quote_rate: number | null;
  /** * The 24h exchange rate for the requested quote currency. */
  quote_rate_24h: number;
  /** * The current balance converted to fiat in `quote-currency`. */
  quote: number;
  /** * The 24h balance converted to fiat in `quote-currency`. */
  quote_24h: number;
  /** * A prettier version of the quote for rendering purposes. */
  pretty_quote: string;
  /** * A prettier version of the 24h quote for rendering purposes. */
  pretty_quote_24h: string;
  /** * The protocol metadata. */
  protocol_metadata: ProtocolMetadata | null;
  /** * NFT-specific data. */
  nft_data: BalanceNftData[] | null;
}

interface ProtocolMetadata {
  /** * The name of the protocol. */
  protocol_name: string;
}

export interface BalanceNftData {
  /** * The token's id. */
  token_id: string | null;
  /** * The count of the number of NFTs with this ID. */
  token_balance: string | null;
  /** * External URL for additional metadata. */
  token_url: string;
  /** * A list of supported standard ERC interfaces, eg: `ERC20` and `ERC721`. */
  supports_erc: string[];
  /** * The latest price value on chain of the token ID. */
  token_price_wei: string | null;
  /** * The latest quote_rate of the token ID denominated in unscaled ETH. */
  token_quote_rate_eth: string;
  /** * The address of the original owner of this NFT. */
  original_owner: string;
  external_data: NftExternalDataV1;
  /** * The current owner of this NFT. */
  owner: string;
  /** * The address of the current owner of this NFT. */
  owner_address: string;
  /** * When set to true, this NFT has been Burned. */
  burned: boolean;
}

interface NftExternalDataV1 {
  name: string;
  description: string;
  image: string;
  image_256: string;
  image_512: string;
  image_1024: string;
  animation_url: string;
  external_url: string;
  attributes: NftCollectionAttribute[];
  owner: string;
}

interface LogoUrls {
  /** * The token logo URL. */
  token_logo_url: string;
  /** * The protocol logo URL. */
  protocol_logo_url: string;
  /** * The chain logo URL. */
  chain_logo_url: string;
}

export interface NftCollectionAttribute {
  trait_type: string;
  value: string;
}

export interface NftAddressBalanceNftResponse {
  /** * The requested address. */
  address: string;
  /** * The timestamp when the response was generated. Useful to show data staleness to users. */
  updated_at: Date;
  /** * List of response items. */
  items: NftTokenContractBalanceItem[];
}

export interface NftTokenContractBalanceItem {
  /** * The string returned by the `name()` method. */
  contract_name: string;
  /** * The ticker symbol for this contract. This field is set by a developer and non-unique across a network. */
  contract_ticker_symbol: string;
  /** * Use the relevant `contract_address` to lookup prices, logos, token transfers, etc. */
  contract_address: string;
  /** * A list of supported standard ERC interfaces, eg: `ERC20` and `ERC721`. */
  supports_erc: string[];
  /** * Denotes whether the token is suspected spam. Supports `eth-mainnet` and `matic-mainnet`. */
  is_spam: boolean;
  last_transfered_at: Date;
  /** * The asset balance. Use `contract_decimals` to scale this balance for display purposes. */
  balance: string | null;
  balance_24h: string;
  type: string;
  /** * The current floor price converted to fiat in `quote-currency`. The floor price is determined by the last minimum sale price within the last 30 days across all the supported markets where the collection is sold on. */
  floor_price_quote: number;
  /** * A prettier version of the floor price quote for rendering purposes. */
  pretty_floor_price_quote: string;
  /** * The current floor price in native currency. The floor price is determined by the last minimum sale price within the last 30 days across all the supported markets where the collection is sold on. */
  floor_price_native_quote: number;
  nft_data: NftData[];
}

export interface NftData {
  /** * The token's id. */
  token_id: string | null;
  token_url: string;
  /** * The original minter. */
  original_owner: string;
  /** * The current holder of this NFT. */
  current_owner: string;
  external_data: NftExternalData | null;
  /** * If `true`, the asset data is available from the Covalent CDN. */
  asset_cached: boolean;
  /** * If `true`, the image data is available from the Covalent CDN. */
  image_cached: boolean;
}

interface NftExternalData {
  name: string;
  description: string;
  asset_url: string;
  asset_file_extension: string;
  asset_mime_type: string;
  asset_size_bytes: string;
  image: string;
  image_256: string;
  image_512: string;
  image_1024: string;
  animation_url: string;
  external_url: string;
  attributes: NftCollectionAttribute[];
}
