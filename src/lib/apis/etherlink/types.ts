import { ETHERLINK_API_URLS } from './constants';

export type EtherlinkChainId = keyof typeof ETHERLINK_API_URLS;

export const isEtherlinkSupportedChainId = (chainId: number): chainId is EtherlinkChainId =>
  chainId in ETHERLINK_API_URLS;

// TODO: Add more properties to these interfaces as needed
interface EtherlinkAddressParam {
  hash: HexString;
  name: string | null;
}

interface EtherLinkInputParameter {
  name: string;
  type: string;
  value: any;
}

interface EtherlinkDecodedInput {
  method_call: string;
  method_id: string;
  parameters: EtherLinkInputParameter[];
}

type TransactionType = 'token_transfer' | 'contract_creation' | 'contract_call' | 'token_creation' | 'coin_transfer';

export interface EtherlinkTransaction {
  hash: string;
  timestamp: string;
  block_number: number;
  from: EtherlinkAddressParam;
  to: EtherlinkAddressParam | null;
  position: number;
  transaction_types: TransactionType[];
  status: 'ok' | 'error';
  value: string;
  decoded_input: EtherlinkDecodedInput | null;
  created_contract: EtherlinkAddressParam | null;
  raw_input: HexString;
  fee: { type: 'maximum' | 'actual'; value: string } | null;
}

interface EtherlinkInternalTransaction {
  block_index: number;
  index: number;
  from: EtherlinkAddressParam;
  to: EtherlinkAddressParam | null;
  value: string;
}

type EtherlinkTokenType = 'ERC-20' | 'ERC-721' | 'ERC-1155';

interface EtherlinkTokenInfo<T extends EtherlinkTokenType = EtherlinkTokenType> {
  icon_url: string | null;
  name: string | null;
  decimals: string | null;
  symbol: string | null;
  address: HexString;
  address_hash: HexString;
  type: T;
  exchange_rate: string | null;
}

interface EtherlinkTotalERC20 {
  decimals: string;
  value: string;
}

interface EtherlinkNFTMetadata {
  attributes: Array<{ trait_type: string; value: string }> | null;
  description: string | null;
  image: string | null;
  name: string | null;
}

interface EtherlinkNFTInstance {
  id: string;
  animation_url: string | null;
  external_app_url: string | null;
  image_url: string | null;
  media_type: string | null;
  media_url: string | null;
  token: EtherlinkTokenInfo<'ERC-721' | 'ERC-1155'>;
  metadata: EtherlinkNFTMetadata | null;
  owner: EtherlinkAddressParam | null;
}

interface EtherlinkTotalERC721 {
  token_id: string;
  token_instance: EtherlinkNFTInstance;
}

interface EtherlinkTotalERC1155 {
  token_id: string;
  decimals: string;
  value: string;
  token_instance: EtherlinkNFTInstance;
}

interface EtherlinkTokenTransferBase {
  log_index: number;
  from: EtherlinkAddressParam;
  to: EtherlinkAddressParam;
  token: EtherlinkTokenInfo;
  total: EtherlinkTotalERC20 | EtherlinkTotalERC721 | EtherlinkTotalERC1155;
}

interface EtherlinkTokenTransferERC20 extends EtherlinkTokenTransferBase {
  token: EtherlinkTokenInfo<'ERC-20'>;
  total: EtherlinkTotalERC20;
}
interface EtherlinkTokenTransferERC721 extends EtherlinkTokenTransferBase {
  token: EtherlinkTokenInfo<'ERC-721'>;
  total: EtherlinkTotalERC721;
}
interface EtherlinkTokenTransferERC1155 extends EtherlinkTokenTransferBase {
  token: EtherlinkTokenInfo<'ERC-1155'>;
  total: EtherlinkTotalERC1155;
}
export type EtherlinkTokenTransfer =
  | EtherlinkTokenTransferERC20
  | EtherlinkTokenTransferERC721
  | EtherlinkTokenTransferERC1155;

export const isErc20TokenTransfer = (transfer: EtherlinkTokenTransfer): transfer is EtherlinkTokenTransferERC20 =>
  transfer.token.type === 'ERC-20';
export const isErc721TokenTransfer = (transfer: EtherlinkTokenTransfer): transfer is EtherlinkTokenTransferERC721 =>
  transfer.token.type === 'ERC-721';
export const isErc1155TokenTransfer = (transfer: EtherlinkTokenTransfer): transfer is EtherlinkTokenTransferERC1155 =>
  transfer.token.type === 'ERC-1155';

export interface EtherlinkTokenBalance {
  token_instance: EtherlinkNFTInstance | null;
  token_id: string | null;
  token: EtherlinkTokenInfo;
}

export interface EtherlinkLog {
  address: EtherlinkAddressParam;
  data: HexString;
  // TODO: Change the type when missing properties become necessary
  decoded: EtherlinkDecodedInput | null;
  topics: (HexString | null)[];
  index: number;
}

export interface EtherlinkPageParams {
  block_number: number;
  index: number;
  items_count: number;
  fee?: string;
  hash?: string;
  inserted_at?: string;
  value?: string;
}

export interface ItemsWithPagination<T> {
  items: T[];
  nextPageParams: EtherlinkPageParams | null;
}

export type EtherlinkOperationsResponse = ItemsWithPagination<EtherlinkTransaction>;

export type EtherlinkInternalTransactionsResponse = ItemsWithPagination<EtherlinkInternalTransaction>;

export type EtherlinkTokensTransfersResponse = ItemsWithPagination<EtherlinkTokenTransfer>;

export type EtherlinkTxLogsResponse = ItemsWithPagination<EtherlinkLog>;
