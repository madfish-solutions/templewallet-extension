import { EvmReviewData, TezosReviewData } from 'app/pages/Send/form/interfaces';
import { TxHash } from 'temple/front/chains';
import { TempleChainKind } from 'temple/types';

export type ReviewDataForChain<T extends TempleChainKind> = T extends TempleChainKind.EVM
  ? EvmReviewData
  : TezosReviewData;

export interface TxData<T extends TempleChainKind> {
  txHash: TxHash<T>;
  displayedFee?: string;
  displayedStorageFee?: string;
}
