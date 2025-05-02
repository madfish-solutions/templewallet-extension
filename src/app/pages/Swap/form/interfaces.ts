import { WalletParamsWithKind } from '@taquito/taquito';
import { BatchWalletOperation } from '@taquito/taquito/dist/types/wallet/batch-operation';

import { TezosReviewData as GenericTezosReviewData } from 'lib/temple/front/estimation-data-providers';

interface BaseReviewData {
  opParams: WalletParamsWithKind[];
  onConfirm: SyncFn<BatchWalletOperation | undefined>;
  cashbackInTkey?: string;
  minimumReceived?: {
    amount: string;
    symbol: string;
  };
}

export type TezosReviewData = GenericTezosReviewData<BaseReviewData>;
