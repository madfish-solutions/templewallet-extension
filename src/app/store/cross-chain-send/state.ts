import { CrossChainAsset } from 'lib/cross-chain';
import { TempleChainKind } from 'temple/types';

export type CrossChainPhase =
  | 'PENDING_TX'
  | 'TX_CONFIRMED'
  | 'EXCHANGING'
  | 'COMPLETED'
  | 'FAILED';

export interface CrossChainExchange {
  /** Exolix exchange id */
  id: string;
  /** Account address (lowercase for EVM) */
  accountId: string;
  sourceChainKind: TempleChainKind;
  sourceChainId: string | number;
  senderAddress?: string;
  sourceTxHash?: string;
  depositAddress: string;
  depositExtraId?: string | null;
  recipient: string;
  fromAsset: CrossChainAsset;
  toAsset: CrossChainAsset;
  fromAmount: string;
  toAmountEstimated: string;
  toAmountActual?: string;
  phase: CrossChainPhase;
  /** Raw Exolix status string (e.g. 'wait' | 'confirmation' | 'exchanging' | 'success' | 'overdue' | 'refunded') */
  exolixStatus?: string;
  hashIn?: { hash: string | null; link: string | null };
  hashOut?: { hash: string | null; link: string | null };
  /** On-chain refund tx hash on the source chain when Exolix returns the deposit. */
  refundHash?: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  bannerDismissed?: boolean;
}

export interface CrossChainSendState {
  byId: Record<string, CrossChainExchange>;
  ids: string[];
  lastCheckedAt?: number;
}

export const crossChainSendInitialState: CrossChainSendState = {
  byId: {},
  ids: []
};
