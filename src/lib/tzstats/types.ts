export enum TZStatsNetwork {
  Mainnet = "https://api.tzstats.com",
  Carthagenet = "https://api.carthagenet.tzstats.com",
  Delphinet = "https://api.delphi.tzstats.com",
  Edonet = "https://api.edo.tzstats.com",
}

export interface ErrorData {
  code: number;
  status: number;
  message: string;
  scope: string;
  detail: string;
  request_id: string;
}

export type AddressType = "ed25519" | "secp256k1" | "p256";

export type OperationStatus = "applied" | "failed" | "backtracked" | "skipped";

export interface TZStatsAccountOp extends TZStatsAccount {
  ops: TZStatsOperation[];
}

export interface TZStatsAccount {
  address: string;
  address_type: AddressType;
  delegate: string;
  manager: string;
  pubkey: string;
  first_in: number;
  first_out: number;
  last_in: number;
  last_out: number;
  first_seen: number;
  last_seen: number;
  delegated_since: number;
  delegate_since: number;
  first_in_time: Date;
  first_out_time: Date;
  last_in_time: Date;
  last_out_time: Date;
  first_seen_time: Date;
  last_seen_time: Date;
  delegated_since_time: Date;
  delegate_since_time: Date;
  total_received: number;
  total_sent: number;
  total_burned: number;
  total_fees_paid: number;
  total_rewards_earned: number;
  total_fees_earned: number;
  total_lost: number;
  frozen_deposits: number;
  frozen_rewards: number;
  frozen_fees: number;
  unclaimed_balance: number;
  spendable_balance: number;
  total_balance: number;
  delegated_balance: number;
  staking_balance: number;
  total_delegations: number;
  active_delegations: number;
  is_funded: boolean;
  is_activated: boolean;
  is_vesting: boolean;
  is_spendable: boolean;
  is_delegatable: boolean;
  is_delegated: boolean;
  is_revealed: boolean;
  is_delegate: boolean;
  is_active_delegate: boolean;
  is_contract: boolean;
  blocks_baked: number;
  blocks_missed: number;
  blocks_stolen: number;
  blocks_endorsed: number;
  slots_endorsed: number;
  slots_missed: number;
  n_ops: number;
  n_ops_failed: number;
  n_tx: number;
  n_delegation: number;
  n_origination: number;
  n_proposal: number;
  n_ballot: number;
  token_gen_min: number;
  token_gen_max: number;
  grace_period: number;
  rolls: number;
  rich_rank: number;
  traffic_rank: number;
  flow_rank: number;
  last_bake_height: number;
  last_bake_block: string;
  last_bake_time: Date;
  last_endorse_height: number;
  last_endorse_block: string;
  last_endorse_time: Date;
  next_bake_height: number;
  next_bake_priority: number;
  next_bake_time: Date;
  next_endorse_height: number;
  next_endorse_time: Date;
  ops?: TZStatsOperation[];
}

export interface TZStatsContract {
  address: string;
  manager: string;
  delegate: string;
  height: number;
  fee: number;
  gas_limit: number;
  gas_used: number;
  gas_price: number;
  storage_limit: number;
  storage_size: number;
  storage_paid: number;
  is_funded: boolean;
  is_vesting: boolean;
  is_spendable: boolean;
  is_delegatable: boolean;
  is_delegated: boolean;
  first_in: number;
  first_out: number;
  last_in: number;
  last_out: number;
  first_seen: number;
  last_seen: number;
  delegated_since: number;
  first_in_time: Date;
  first_out_time: Date;
  last_in_time: Date;
  last_out_time: Date;
  first_seen_time: Date;
  last_seen_time: Date;
  delegated_since_time: Date;
  n_ops: number;
  n_ops_failed: number;
  n_tx: number;
  n_delegation: number;
  n_origination: number;
  token_gen_min: number;
  token_gen_max: number;
  bigmap_ids: BigInt64Array;
}

export interface TZStatsContractScript {
  script: object;
  storage_type: object;
  entrypoint: object;
}

export interface TZStatsContractStorage {
  meta: object;
  value: object;
  entrypoint: object;
}

export interface TZStatsContractCalls {
  entrypoint: string;
  branch: string;
  id: number;
  value: object;
  prim: object;
}

export interface TZStatsMarketTicker {
  pair: string;
  base: string;
  quote: string;
  exchange: string;
  open: number;
  high: number;
  low: number;
  last: number;
  change: number;
  vwap: number;
  n_trades: number;
  volume_base: number;
  volume_quote: number;
  timestamp: string;
}

export interface TZStatsOperation {
  hash: string;
  type: string; // it is should be enum
  block: string;
  time: string;
  height: number;
  cycle: number;
  counter: number;
  op_n: number;
  op_c: number;
  op_i: number;
  status: OperationStatus;
  is_success: boolean;
  is_contract: boolean;
  gas_limit: number;
  gas_used: number;
  gas_price: number;
  storage_limit: number;
  storage_size: number;
  storage_paid: number;
  row_id: number;
  volume: number;
  fee: number;
  reward: number;
  deposit: number;
  burned: number;
  is_internal: boolean;
  has_data: boolean;
  data: any; //any??
  parameters: object; // in docs we have a duplication of "parameters"
  storage: object;
  big_map_diff: object;
  errors: object;
  days_destroyed: number;
  sender: string;
  receiver: string;
  delegate: string;
  manager: string;
  branch_id: number;
  branch_height: number;
  branch_depth: number;
  branch: string;
}

export type QueryArguments = Partial<{
  // columns: string[],
  limit: number;
  cursor: number;
  order: "asc" | "desc";
}>;

export type QueryFilter = [QFColumn, QFOperator, QFArgument];

export type QFColumn = string;
export type QFArgument = string;

export enum QFOperator {
  Equal = "eq",
  NotEqual = "ne",
  GreaterThan = "gt",
  GreaterThanOrEqual = "gte",
  LessThan = "lt",
  LessThanOrEqual = "lte",
  InclusionInList = "in",
  NotIncludedInList = "nin",
  Range = "rg",
  Regexp = "re",
}

export interface OperationRow {
  rowId: number;
  time: number;
  height: number;
  cycle: number;
  hash: string;
  counter: number;
  opN: number;
  opL: number;
  opP: number;
  opC: number;
  opI: number;
  type: string;
  status: OperationStatus;
  isSuccess: boolean;
  isContract: boolean;
  gasLimit: number;
  gasUsed: number;
  gasPrice: number;
  storageLimit: number;
  storageSize: number;
  storagePaid: number;
  volume: number;
  fee: number;
  reward: number;
  deposit: number;
  burned: number;
  senderId: number;
  receiverId: number;
  managerId: number;
  delegateId: number;
  isInternal: boolean;
  hasData: boolean;
  data: any;
  parameters: string | null;
  storage: string | null;
  bigMapDiff: string | null;
  errors: string | null;
  daysDestroyed: number;
  branchId: number;
  branchHeight: number;
  branchDepth: number;
  isImplicit: boolean;
  entrypointId: number;
  sender: string;
  receiver: string | null;
  manager: string | null;
  delegate: string | null;
}

export type OperationRowTuple = [
  number, // [row_id] - uint64
  number, // [time] - datetime
  number, // [height] - int64
  number, // [cycle] - int64
  string, // [hash] - hash
  number, // [counter] - int64
  number, // [op_n] - int64
  number, // [op_l] - int64
  number, // [op_p] - int64
  number, // [op_c] - int64
  number, // [op_i] - int64
  string, // [type] - enum (OperationType)
  OperationStatus, // [status] - enum
  boolean, // [is_success] - flag boolean
  boolean, // [is_contract] - flag boolean
  number, // [gas_limit] - int64
  number, // [gas_used] - int64
  number, // [gas_price] - float
  number, // [storage_limit] - int64
  number, // [storage_size] - int64
  number, // [storage_paid] - int64
  number, // [volume] - money
  number, // [fee] - money
  number, // [reward] - money
  number, // [deposit] - money
  number, // [burned] - money
  number, // [sender_id] - uint64
  number, // [receiver_id] - uint64
  number, // [manager_id] - uint64
  number, // [delegate_id] - uint64
  boolean, // [is_internal] - flag bool
  boolean, // [has_data] - flag bool
  any, // [data] - bytes
  string | null, // [parameters] - object
  string | null, // [storage] - bytes
  string | null, // [big_map_diff] - bytes
  string | null, // [errors] - bytes
  number, // [days_destroyed] - float
  number, // [branch_id] - uint64
  number, // [branch_height] - int64
  number, // [branch_depth] - int64
  boolean, // [is_implicit] - flag bool
  number, // [entrypoint_id] - int64
  string, // [sender] - hash
  string | null, // [receiver] - hash
  string | null, // [manager] - hash
  string | null // [delegate] - hash
];
