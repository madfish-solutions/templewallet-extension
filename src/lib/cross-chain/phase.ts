import { CrossChainPhase } from 'app/store/cross-chain-send/state';
import { OrderStatusEnum } from 'lib/apis/exolix/types';

const TERMINAL_PHASES: ReadonlyArray<CrossChainPhase> = ['COMPLETED', 'FAILED'];

export const isTerminalPhase = (phase: CrossChainPhase) => TERMINAL_PHASES.includes(phase);

export const mapExolixStatusToPhase = (status: string, previous: CrossChainPhase): CrossChainPhase => {
  switch (status) {
    case OrderStatusEnum.WAIT:
      return previous === 'TX_CONFIRMED' ? 'TX_CONFIRMED' : 'PENDING_TX';
    case OrderStatusEnum.CONFIRMATION:
      return 'TX_CONFIRMED';
    case OrderStatusEnum.EXCHANGING:
      return 'EXCHANGING';
    case OrderStatusEnum.SUCCESS:
      return 'COMPLETED';
    case OrderStatusEnum.OVERDUE:
    case OrderStatusEnum.REFUNDED:
      return 'FAILED';
    default:
      return previous;
  }
};
