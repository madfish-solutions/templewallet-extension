import { OrderStatusEnum } from 'lib/apis/exolix/types';

import { CrossChainPhase } from './types';

const TERMINAL_PHASES: ReadonlyArray<CrossChainPhase> = ['COMPLETED', 'FAILED'];

export const isTerminalPhase = (phase: CrossChainPhase) => TERMINAL_PHASES.includes(phase);

export const mapExolixStatusToPhase = (status: string, previous: CrossChainPhase): CrossChainPhase => {
  switch (status) {
    case OrderStatusEnum.WAIT:
      return previous === 'TX_CONFIRMED' ? 'TX_CONFIRMED' : 'PENDING_TX';
    case OrderStatusEnum.CONFIRMATION:
    case OrderStatusEnum.CONFIRMED:
      return 'TX_CONFIRMED';
    case OrderStatusEnum.EXCHANGING:
    case OrderStatusEnum.SENDING:
      return 'EXCHANGING';
    case OrderStatusEnum.SUCCESS:
      return 'COMPLETED';
    case OrderStatusEnum.OVERDUE:
    case OrderStatusEnum.REFUND:
    case OrderStatusEnum.REFUNDED:
      return 'FAILED';
    default:
      // Unknown status — treat as terminal so polling stops instead of looping forever.
      return 'FAILED';
  }
};
