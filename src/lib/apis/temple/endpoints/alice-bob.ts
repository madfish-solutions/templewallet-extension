import { templeWalletApi } from './templewallet.api';

enum AliceBobOrderStatus {
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

interface AliceBobOrderInfo {
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

export interface AliceBobPairInfo {
  from: string;
  to: string;
  fromnetwork: string | null;
  tonetwork: string | null;
  in: string;
  out: string;
  ratetype: string;
  amount: string;
  tofee: string;
  fromfee: string;
  minamount: string;
  maxamount: string;
}

export const createAliceBobOrder = (
  amount: string,
  inputAssetCode: string,
  outputAssetCode: string,
  userId: string,
  walletAddress?: string,
  cardNumber?: string
) =>
  templeWalletApi.post<{ orderInfo: AliceBobOrderInfo }>('/alice-bob/create-order', null, {
    params: {
      amount,
      from: getFromToParam(inputAssetCode),
      to: getFromToParam(outputAssetCode),
      userId,
      walletAddress,
      cardNumber
    }
  });

export const getAliceBobPairsInfo = (isWithdraw: boolean) =>
  templeWalletApi.get<{ pairsInfo: AliceBobPairInfo[] }>('/alice-bob/get-pairs-info', { params: { isWithdraw } });

export const estimateAliceBobOutput = (amount: string, inputAssetCode: string, outputAssetCode: string) =>
  templeWalletApi.post<{ outputAmount: number }>('/alice-bob/estimate-amount', null, {
    params: {
      amount,
      from: getFromToParam(inputAssetCode),
      to: getFromToParam(outputAssetCode)
    }
  });

const getFromToParam = (code: string) => (code === 'XTZ' ? 'TEZ' : `CARD${code}`);
