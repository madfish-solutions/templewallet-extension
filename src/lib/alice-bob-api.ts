import makeBuildQueryFn from './makeBuildQueryFn';

export interface aliceBobOrder {
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

const buildQuery = makeBuildQueryFn<Record<string, string>, any>('http://localhost:3000');

export const getSignedAliceBobUrl = buildQuery('GET', '/api/alice-bob-sign', [
  'isWithdraw',
  'amount',
  'userId',
  'walletAddress',
  'cardNumber'
]);

export const getAliceBobPairInfo = buildQuery('GET', '/api/alice-bob-pair-info', ['isWithdraw']);

export const getAliceBobOutputEstimation = buildQuery('GET', '/api/alice-bob-output-estimation', [
  'isWithdraw',
  'amount'
]);
