interface ExolixNetwork {
  addressRegex: string;
  blockExplorer: string | null;
  depositMinAmount: number | null;
  isDefault: boolean;
  memoName: string;
  memoNeeded: boolean;
  memoRegex: string;
  name: string;
  network: string;
  notes: string;
  precision: number;
  shortName: string | null;
}

interface ExolixCurrency {
  icon: string;
  name: string;
  code: string;
  networks: Array<ExolixNetwork>;
}

export interface ExolixCurrenciesResponse {
  data: Array<ExolixCurrency>;
  count: number;
}

interface ExchangeCurrency {
  coinCode: string;
  coinName: string;
  icon: string;
  memoName: string;
  network: string;
  networkName: string;
  networkShortName: string;
}

export interface ExchangeHash {
  hash: string | null;
  link: string | null;
}

export interface ExchangeData {
  amount: string;
  amountTo: string;
  coinFrom: ExchangeCurrency;
  coinTo: ExchangeCurrency;
  createdAt: string;
  depositAddress: string;
  depositExtraId: string | null;
  withdrawalAddress: string;
  withdrawalExtraId: string | null;
  hashIn: ExchangeHash;
  hashOut: ExchangeHash;
  /** On-chain tx hash on the source chain when Exolix refunds the deposit. Present when status is REFUNDED. */
  refundHash?: string | null;
  refundExtraId?: string | null;
  id: string;
  comment: string | null;
  rate: string;
  status: string;
}

export enum OrderStatusEnum {
  WAIT = 'wait',
  CONFIRMATION = 'confirmation',
  CONFIRMED = 'confirmed',
  EXCHANGING = 'exchanging',
  SENDING = 'sending',
  SUCCESS = 'success',
  OVERDUE = 'overdue',
  REFUND = 'refund',
  REFUNDED = 'refunded'
}

export interface GetRateRequestData {
  coinFrom: string;
  coinFromNetwork: string;
  coinTo: string;
  coinToNetwork: string;
  amount: number;
}

export interface CrossChainRateRequestData {
  coinFrom: string;
  coinFromNetwork: string;
  coinTo: string;
  coinToNetwork: string;
  /** String to preserve precision for 18-decimal tokens. */
  amount: string;
}

interface GetRateResponseWithAmountTooLow {
  fromAmount: number;
  toAmount: number;
  message: string;
  minAmount: number;
}

interface GetRateResponseWithAmountTooHigh {
  fromAmount: number;
  toAmount: number;
  message: string;
  maxAmount: number;
}

interface GetRateSuccessResponse {
  fromAmount: number;
  toAmount: number;
  rate: number;
  message: null;
  minAmount: number;
  withdrawMin: number;
  maxAmount: number;
}

interface GetRateUnsupportedPairResponse {
  error: string;
}

export type GetRateResponse =
  | GetRateResponseWithAmountTooLow
  | GetRateResponseWithAmountTooHigh
  | GetRateSuccessResponse
  | GetRateUnsupportedPairResponse;

export type NormalizedRateResult =
  | { kind: 'ok'; fromAmount: number; toAmount: number; rate: number; minAmount: number; maxAmount: number }
  | { kind: 'min-bound'; minAmount: number; message: string }
  | { kind: 'max-bound'; maxAmount: number; message: string }
  | { kind: 'unsupported' }
  | { kind: 'unknown' };
