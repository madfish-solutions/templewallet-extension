import { CurrencyToken } from 'app/templates/TopUpInput';

export interface ExchangeCoin {
  coinCode: string;
  coinName: string;
  icon: string;
  memoName: string;
  network: string;
  networkName: string;
  networkShortName: string;
}

interface ExchangeHash {
  hash: string | null;
  link: string | null;
}

export interface ExchangeDataInterface {
  amount: string;
  amountTo: string;
  coinFrom: ExchangeCoin;
  coinTo: ExchangeCoin;
  createdAt: string;
  depositAddress: string;
  depositExtraId: string | null;
  withdrawalAddress: string;
  withdrawalExtraId: string | null;
  hashIn: ExchangeHash;
  hashOut: ExchangeHash;
  id: string;
  comment: string | null;
  rate: string;
  status: string;
}

export enum ExchangeDataStatusEnum {
  WAIT = 'wait',
  CONFIRMATION = 'confirmation',
  EXCHANGING = 'exchanging',
  SUCCESS = 'success',
  OVERDUE = 'overdue',
  REFUNDED = 'refunded'
}

export interface GetRateRequestData {
  coinFrom: string;
  coinFromNetwork: string;
  coinTo: string;
  coinToNetwork: string;
  amount: number;
}

export interface GetRateResponse {
  toAmount: number;
  minAmount: number;
  maxAmount: number;
  rate: number;
  withdrawMin: number;
  message: null;
}

export interface GetRateResponseWithAmountTooLow {
  toAmount: number;
  minAmount: number;
  maxAmount: number;
  rate: null;
  message: string;
}

export interface OutputCurrencyInterface extends CurrencyToken {
  slug?: string;
}

interface ExolixNetworkInterface {
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

export interface ExolixCurrenciesInterface {
  data: Array<{
    icon: string;
    name: string;
    code: string;
    networks: Array<ExolixNetworkInterface>;
  }>;
  count: number;
}
