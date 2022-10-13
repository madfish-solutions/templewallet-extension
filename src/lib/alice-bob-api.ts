import { templewalletQueryLOCAL } from './templewallet-api/templewallet-query';

export interface AliceBobOrderInfo {
  id: string;
  status: string;
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

export const createAliceBobOrder = templewalletQueryLOCAL<QueryParams, { orderInfo: AliceBobOrderInfo }>(
  'POST',
  '/alice-bob/create-order',
  ['isWithdraw', 'amount', 'userId', 'walletAddress', 'cardNumber']
);

export const cancelAliceBobOrder = templewalletQueryLOCAL<QueryParams, null>('POST', '/alice-bob/cancel-order', [
  'orderId'
]);

export const getAliceBobPairInfo = templewalletQueryLOCAL<QueryParams, { pairInfo: AliceBobPairInfo }>(
  'GET',
  '/alice-bob/get-pair-info',
  ['isWithdraw']
);

export const getAliceBobOrders = templewalletQueryLOCAL<QueryParams, { orders: AliceBobOrderInfo[] }>(
  'GET',
  '/alice-bob/get-orders',
  ['userId']
);

export const getAliceBobOrderInfo = templewalletQueryLOCAL<QueryParams, { orderInfo: AliceBobOrderInfo }>(
  'GET',
  '/alice-bob/check-order',
  ['orderId']
);

export const estimateAliceBobOutput = templewalletQueryLOCAL<QueryParams, { outputAmount: number }>(
  'POST',
  '/alice-bob/estimate-amount',
  ['isWithdraw', 'amount']
);
