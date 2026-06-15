import { Estimate, TezosOperationError, TezosToolkit, WalletParamsWithKind, getRevealGasLimit } from '@taquito/taquito';

import { tezosManagerKeyHasManager } from 'lib/tezos';

import { isRoute3SwapOp } from './swap.utils';

const MAX_GAS_REBALANCE_ATTEMPTS = 3;

const SIMPLE_OP_GAS_LIMIT = 15000;

const MEASURED_GAS_BUFFER_RATIO = 1.1;
const MEASURED_GAS_BUFFER_PAD = 200;

interface RebalanceContext {
  blockGasLimit: number;
  perOpGasLimit: number;
  revealGasReserve: number;
}

interface OpResultMetadata {
  operation_result?: { status?: string; consumed_milligas?: string | number };
  internal_operation_results?: Array<{ result?: { consumed_milligas?: string | number } }>;
}

/**
 * Last-resort gas rescue for a swap batch whose estimation fails with "gas_exhausted". It runs after
 * the proactive 3Route guard, for the batches that guard still starves, such as a swap to an illiquid
 * token whose "execute" needs more than its even share of the block gas.
 *
 * Taquito spreads the block gas evenly across ops that have no explicit limit, so one heavy op can run
 * out while lighter ops sit on gas they never use. On each failure this:
 *   1. measures what the already-executed ops actually consumed (including their internal operations)
 *   2. gives each of them to that measured need plus a buffer
 *   3. gives the op that ran out of gas the freed remainder.
 * It only redistributes the existing budget and never raises the total, so it adapts to whichever op
 * is heavy without relying on a fixed split.
 */
export async function estimateBatchWithGasRebalance(
  tezos: TezosToolkit,
  sourcePkh: string,
  opParams: WalletParamsWithKind[]
): Promise<Estimate[]> {
  let currentOpParams = opParams;
  let context: RebalanceContext | undefined;
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_GAS_REBALANCE_ATTEMPTS; attempt++) {
    try {
      return await tezos.estimate.batch(currentOpParams.map(params => ({ ...params, source: sourcePkh })));
    } catch (estimationError) {
      lastError = estimationError;

      if (attempt === MAX_GAS_REBALANCE_ATTEMPTS || !isRescuableGasExhaustion(estimationError)) {
        break;
      }

      if (!context) {
        context = await loadRebalanceContext(tezos, sourcePkh);
      }

      const rebalancedOpParams = rebalanceGasFromError(currentOpParams, estimationError, context);
      if (!rebalancedOpParams) {
        break;
      }

      currentOpParams = rebalancedOpParams;
    }
  }

  throw lastError;
}

function isRescuableGasExhaustion(error: unknown): error is TezosOperationError {
  return error instanceof TezosOperationError && error.errors.some(err => err.id.includes('gas_exhausted'));
}

async function loadRebalanceContext(tezos: TezosToolkit, sourcePkh: string): Promise<RebalanceContext> {
  const manager = await tezos.rpc.getManagerKey(sourcePkh);
  const constants = await tezos.rpc.getConstants();

  return {
    blockGasLimit: constants.hard_gas_limit_per_block.toNumber(),
    perOpGasLimit: constants.hard_gas_limit_per_operation.toNumber(),
    revealGasReserve: tezosManagerKeyHasManager(manager) ? 0 : getRevealGasLimit(sourcePkh)
  };
}

function rebalanceGasFromError(
  opParams: WalletParamsWithKind[],
  error: TezosOperationError,
  { blockGasLimit, perOpGasLimit, revealGasReserve }: RebalanceContext
): WalletParamsWithKind[] | null {
  const operationsWithResults: any[] = error.operationsWithResults;
  const resultMetadataAt = (resultIndex: number): OpResultMetadata | undefined =>
    operationsWithResults[resultIndex]?.metadata;

  // Unrevealed account, taquito prepends a reveal, so results run one ahead of opParams.
  const revealOffset = operationsWithResults.length - opParams.length;
  if (revealOffset !== 0 && revealOffset !== 1) return null;

  // The failer may show as "backtracked", so locate it by position: the op just before the first skipped one.
  const firstSkippedIndex = operationsWithResults.findIndex(
    (_, i) => resultMetadataAt(i)?.operation_result?.status === 'skipped'
  );
  const failedResultIndex = firstSkippedIndex === -1 ? operationsWithResults.length - 1 : firstSkippedIndex - 1;
  const failedOpIndex = failedResultIndex - revealOffset;
  if (failedOpIndex < 0) return null;

  const pinnedGasLimits = opParams.map<number | undefined>((op, index) => {
    if (index === failedOpIndex) return undefined;

    const metadata = resultMetadataAt(index + revealOffset);
    const status = metadata?.operation_result?.status;
    if (status === 'applied' || status === 'backtracked') {
      return Math.ceil((totalConsumedGas(metadata) / 1000) * MEASURED_GAS_BUFFER_RATIO) + MEASURED_GAS_BUFFER_PAD;
    }

    return isRoute3SwapOp(op) ? undefined : SIMPLE_OP_GAS_LIMIT;
  });

  const pinnedGasTotal = pinnedGasLimits.reduce<number>((sum, gas) => sum + (gas ?? 0), 0);
  const remainderOpsCount = pinnedGasLimits.filter(gas => gas === undefined).length;
  if (remainderOpsCount === 0) return null;

  const gasPerRemainderOp = Math.min(
    Math.floor((blockGasLimit - revealGasReserve - pinnedGasTotal) / remainderOpsCount),
    perOpGasLimit
  );
  if (gasPerRemainderOp <= 0) return null;

  return opParams.map((op, index) => ({ ...op, gasLimit: pinnedGasLimits[index] ?? gasPerRemainderOp }));
}

function totalConsumedGas(metadata: OpResultMetadata | undefined): number {
  const ownConsumed = Number(metadata?.operation_result?.consumed_milligas ?? 0);
  const internalConsumed = (metadata?.internal_operation_results ?? []).reduce(
    (sum, internalOp) => sum + Number(internalOp?.result?.consumed_milligas ?? 0),
    0
  );

  return ownConsumed + internalConsumed;
}
