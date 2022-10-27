import { templeWalletApi } from './templewallet.api';

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

export const createAliceBobOrder = (
  isWithdraw: boolean,
  amount: string,
  userId: string,
  walletAddress?: string,
  cardNumber?: string
) =>
  templeWalletApi.post<{ orderInfo: AliceBobOrderInfo }>('/alice-bob/create-order', null, {
    params: {
      isWithdraw,
      amount,
      userId,
      walletAddress,
      cardNumber
    }
  });

export const cancelAliceBobOrder = (orderId: string) =>
  templeWalletApi.post('/alice-bob/cancel-order', null, { params: { orderId } });

export const getAliceBobPairInfo = (isWithdraw: boolean) =>
  templeWalletApi.get<{ pairInfo: AliceBobPairInfo }>('/alice-bob/get-pair-info', { params: { isWithdraw } });

export const getAliceBobOrderInfo = (orderId: string) =>
  templeWalletApi.get<{ orderInfo: AliceBobOrderInfo }>('/alice-bob/check-order', { params: { orderId } });

export const estimateAliceBobOutput = (isWithdraw: boolean, amount: string) =>
  templeWalletApi.post<{ outputAmount: number }>('/alice-bob/estimate-amount', null, {
    params: {
      isWithdraw,
      amount
    }
  });
