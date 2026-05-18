import { CrossChainAsset, CrossChainPhase } from 'lib/cross-chain';
import { TempleChainKind } from 'temple/types';

export type { CrossChainPhase };

export interface CrossChainExchange {
  id: string;
  accountId: string;
  sourceChainKind: TempleChainKind;
  sourceChainId: string | number;
  senderAddress?: string;
  sourceTxHash?: string;
  depositAddress: string;
  depositExtraId: string | null;
  recipient: string;
  fromAsset: CrossChainAsset;
  toAsset: CrossChainAsset;
  fromAmount: string;
  toAmountEstimated: string;
  toAmountActual?: string;
  phase: CrossChainPhase;
  exolixStatus?: string;
  hashIn?: { hash: string | null; link: string | null };
  hashOut?: { hash: string | null; link: string | null };
  refundHash?: string;
  createdAt: number;
  updatedAt: number;
  bannerDismissed?: boolean;
}

export interface CrossChainSendState {
  byId: Record<string, CrossChainExchange>;
  ids: string[];
}

export const crossChainSendInitialState: CrossChainSendState = {
  byId: {},
  ids: []
};
