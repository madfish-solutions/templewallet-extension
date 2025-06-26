/** Types, taken from Alchemy SDK */

export enum AssetTransfersCategory {
  /**
   * Top level ETH transactions that occur where the `fromAddress` is an
   * external user-created address. External addresses have private keys and are
   * accessed by users.
   */
  EXTERNAL = 'external',
  /**
   * Top level ETH transactions that occur where the `fromAddress` is an
   * internal, smart contract address. For example, a smart contract calling
   * another smart contract or sending
   */
  INTERNAL = 'internal',
  /** ERC20 transfers. */
  ERC20 = 'erc20',
  /** ERC721 transfers. */
  ERC721 = 'erc721',
  /** ERC1155 transfers. */
  ERC1155 = 'erc1155',
  /** Special contracts that don't follow ERC 721/1155, (ex: CryptoKitties). */
  SPECIALNFT = 'specialnft'
}

export interface AssetTransfersWithMetadataResult extends AssetTransfersResult {
  /** Additional metadata about the transfer event. */
  metadata: AssetTransfersMetadata;
}

interface AssetTransfersResult {
  /** The unique ID of the transfer. */
  uniqueId: string;
  /** The category of the transfer. */
  category: AssetTransfersCategory;
  /** The block number where the transfer occurred. */
  blockNum: string;
  /** The from address of the transfer. */
  from: string;
  /** The to address of the transfer. */
  to: string | null;
  /**
   * Converted asset transfer value as a number (raw value divided by contract
   * decimal). `null` if ERC721 transfer or contract decimal not available.
   */
  value: number | null;
  /**
   * The raw ERC721 token id of the transfer as a hex string. `null` if not an
   * ERC721 transfer.
   */
  erc721TokenId: string | null;
  /**
   * A list of ERC1155 metadata objects if the asset transferred is an ERC1155
   * token. `null` if not an ERC1155 transfer.
   */
  erc1155Metadata: ERC1155Metadata[] | null;
  /** The token id of the token transferred. */
  tokenId: string | null;
  /**
   * Returns the token's symbol or ETH for other transfers. `null` if the
   * information was not available.
   */
  asset: string | null;
  /** The transaction hash of the transfer transaction. */
  hash: string;
  /** Information about the raw contract of the asset transferred. */
  rawContract: RawContract;
}

interface ERC1155Metadata {
  tokenId: string;
  value: string;
}

interface RawContract {
  /**
   * The raw transfer value as a hex string. `null` if the transfer was for an
   * ERC721 or ERC1155 token.
   */
  value: string | null;
  /** The contract address. `null` if it was an internal or external transfer. */
  address: string | null;
  /**
   * The number of decimals in the contract as a hex string. `null` if the value
   * is not in the contract and not available from other sources.
   */
  decimal: string | null;
}

interface AssetTransfersMetadata {
  /** Timestamp of the block from which the transaction event originated. */
  blockTimestamp: string;
}

export interface Log {
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;

  removed: boolean;

  address: string;
  data: string;

  topics: Array<string>;

  transactionHash: string;
  logIndex: number;
}
