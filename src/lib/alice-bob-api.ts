import { templewalletQuery } from './templewallet-api/templewallet-query';

export enum AliceBobOrderStatus {
  WAITING = 'WAITING',
  EXCHANGING = 'EXCHANGING',
  SENDING = 'SENDING',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  CANCELED = 'CANCELED',
  FAILED = 'FAILED',
  HOLDED = 'HOLDED',
  REFUNDED = 'REFUNDED',
  PREPARED = 'PREPARED'
}

export interface AliceBobOrderInfo {
  id: string;
  status: AliceBobOrderStatus;
  from: string;
  to: string;
  payUrl: string;
  payCryptoAddress: string;
  payCryptoMemo: string;
  fromPaymentDetails: string;
  toPaymentDetails: string;
  toMemo: string;
  fromTxHash: string;
  toTxHash: string;
  fromAmount: number;
  fromAmountReceived: number;
  toAmount: number;
  fromRate: number;
  toRate: number;
  fromFee: number;
  toFee: number;
  side: 'SELL' | 'BUY';
  extraFromFee: number;
  extraToFee: number;
  redirectUrl: string;
  userId: string;
  partnerOrderId: string;
  fromRevenueShare: number;
  toRevenueShare: number;
  created: string;
  updated: string;
  orderExpirationTimetamp: number;
}

interface AliceBobPairInfo {
  minAmount: number;
  maxAmount: number;
}

type QueryParams = Record<string, string>;

export const createAliceBobOrder = templewalletQuery<QueryParams, { orderInfo: AliceBobOrderInfo }>(
  'POST',
  '/alice-bob/create-order',
  ['isWithdraw', 'amount', 'userId', 'walletAddress', 'cardNumber']
);

export const cancelAliceBobOrder = templewalletQuery<QueryParams, null>('POST', '/alice-bob/cancel-order', ['orderId']);

export const getAliceBobPairInfo = templewalletQuery<QueryParams, { pairInfo: AliceBobPairInfo }>(
  'GET',
  '/alice-bob/get-pair-info',
  ['isWithdraw']
);

export const getAliceBobOrderInfo = templewalletQuery<QueryParams, { orderInfo: AliceBobOrderInfo }>(
  'GET',
  '/alice-bob/check-order',
  ['orderId']
);

export const estimateAliceBobOutput = templewalletQuery<QueryParams, { outputAmount: number }>(
  'POST',
  '/alice-bob/estimate-amount',
  ['isWithdraw', 'amount']
);
