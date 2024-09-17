import { Nullable } from './utils';

export type Erc20TransfersResponse = Nullable<{
  items: Nullable<BlockTransactionWithContractTransfers>[];
  pagination: Pagination;
}>;

interface Pagination {
  /** * True is there is another page. */
  has_more: boolean;
  /** * The requested page number. */
  page_number: number;
  /** * The requested number of items on the current page. */
  page_size: number;
  /** @deprecated // Always null
   * The total number of items across all pages for this request.
   */
  total_count: number;
}

interface BlockTransactionWithContractTransfers {
  /** * The block signed timestamp in UTC. */
  block_signed_at: Date;
  /** * The height of the block. */
  block_height: number;
  /** * The hash of the block. Use it to remove transactions from re-org-ed blocks. */
  block_hash: string;
  /** * The requested transaction hash. */
  tx_hash: string;
  /** * The offset is the position of the tx in the block. */
  tx_offset: number;
  /** * Whether or not transaction is successful. */
  successful: boolean;
  /** * The address of the miner. */
  miner_address: string;
  /** * The sender's wallet address. */
  from_address: string;
  /** * The label of `from` address. */
  from_address_label: string;
  /** * The receiver's wallet address. */
  to_address: string;
  /** * The label of `to` address. */
  to_address_label: string;
  /** * The value attached to this tx. */
  value: bigint;
  /** * The value attached in `quote-currency` to this tx. */
  value_quote: number;
  /** * A prettier version of the quote for rendering purposes. */
  pretty_value_quote: string;
  /** * The requested chain native gas token metadata. */
  gas_metadata: ContractMetadata;
  gas_offered: number;
  /** * The gas spent for this tx. */
  gas_spent: number;
  /** * The gas price at the time of this tx. */
  gas_price: number;
  /** * The transaction's gas_price * gas_spent, denoted in wei. */
  fees_paid: bigint;
  /** * The gas spent in `quote-currency` denomination. */
  gas_quote: number;
  /** * A prettier version of the quote for rendering purposes. */
  pretty_gas_quote: string;
  /** * The native gas exchange rate for the requested `quote-currency`. */
  gas_quote_rate: number;
  transfers: Nullable<TokenTransferItem>[];
}

interface ContractMetadata {
  /** * Use contract decimals to format the token balance for display purposes - divide the balance by `10^{contract_decimals}`. */
  contract_decimals: number;
  /** * The string returned by the `name()` method. */
  contract_name: string;
  /** * The ticker symbol for this contract. This field is set by a developer and non-unique across a network. */
  contract_ticker_symbol: string;
  /** * Use the relevant `contract_address` to lookup prices, logos, token transfers, etc. */
  contract_address: string;
  /** * A list of supported standard ERC interfaces, eg: `ERC20` and `ERC721`. */
  supports_erc: string[];
  /** * The contract logo URL. */
  logo_url: string;
}

interface TokenTransferItem {
  /** * The block signed timestamp in UTC. */
  block_signed_at: Date;
  /** * The requested transaction hash. */
  tx_hash: string;
  /** * The sender's wallet address. */
  from_address: string;
  /** * The label of `from` address. */
  from_address_label: string;
  /** * The receiver's wallet address. */
  to_address: string;
  /** * The label of `to` address. */
  to_address_label: string;
  /** * Use contract decimals to format the token balance for display purposes - divide the balance by `10^{contract_decimals}`. */
  contract_decimals: number;
  /** * The string returned by the `name()` method. */
  contract_name: string;
  /** * The ticker symbol for this contract. This field is set by a developer and non-unique across a network. */
  contract_ticker_symbol: string;
  /** * Use the relevant `contract_address` to lookup prices, logos, token transfers, etc. */
  contract_address: string;
  /** * The contract logo URL. */
  logo_url: string;
  /** * Categorizes token transactions as either `transfer-in` or `transfer-out`, indicating whether tokens are being received or sent from an account. */
  transfer_type: string;
  /** * The delta attached to this transfer. */
  delta: bigint;
  /** * The asset balance. Use `contract_decimals` to scale this balance for display purposes. */
  balance: bigint;
  /** * The exchange rate for the requested quote currency. */
  quote_rate: number;
  /** * The current delta converted to fiat in `quote-currency`. */
  delta_quote: number;
  /** * A prettier version of the quote for rendering purposes. */
  pretty_delta_quote: string;
  /** * The current balance converted to fiat in `quote-currency`. */
  balance_quote: number;
  /** * Additional details on which transfer events were invoked. Defaults to `true`. */
  method_calls: Nullable<MethodCallsForTransfers>[];
  /** * The explorer links for this transaction. */
  explorers: Explorer[];
}

interface MethodCallsForTransfers {
  /** * The address of the sender. */
  sender_address: string;
  method: string;
}

interface Explorer {
  /** * The name of the explorer. */
  label: string;
  /** * The URL of the explorer. */
  url: string;
}
