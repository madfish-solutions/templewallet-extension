import { isDefined } from '@rnw-community/shared';
import { BlockResponse, OperationEntry } from '@taquito/rpc';
import { TezosToolkit } from '@taquito/taquito';

import {
  fetchGetOperationsByHashWithBaseUrl,
  getApiBaseURL,
  TzktHubConnection,
  TzktOperation,
  TzktOperationType,
  TzktSubscriptionChannel,
  TzktSubscriptionMethod,
  TzktSubscriptionStateMessageType
} from 'lib/apis/tzkt';
import { TzktOperationsSubscriptionMessage } from 'lib/apis/tzkt/types';
import { CONFIRM_TIMEOUT } from 'lib/fixed-times';
import { delay } from 'lib/utils';

const SYNC_INTERVAL = 10_000;

type ConfirmOperationOptions = {
  initializedAt?: number;
  fromBlockLevel?: number;
  signal?: AbortSignal;
};

/**
 * This list includes types that are not specified in `TzktOperationType` enum because specifying them there
 * requires specifying respective `TzktOperation` type for each of them, which is not necessary for our use cases.
 */
const ALL_COMMA_SEPARATED_OPERATION_TYPES = `transaction,origination,delegation,reveal,register_constant,\
set_deposits_limit,increase_paid_storage,update_consensus_key,tx_rollup_origination,tx_rollup_submit_batch,\
tx_rollup_commit,tx_rollup_return_bond,tx_rollup_finalize_commitment,tx_rollup_remove_commitment,tx_rollup_rejection,\
tx_rollup_dispatch_tickets,transfer_ticket,sr_add_messages,sr_cement,sr_execute,sr_originate,sr_publish,
sr_recover_bond,sr_refute,double_baking,double_endorsing,double_preendorsing,nonce_revelation,vdf_revelation,\
activation,drain_delegate,proposal,ballot,endorsement,preendorsement`;

/**
 * Implements the confirmation of an operation using TzKT Websocket API
 * @param opHash Hash of the operation to confirm
 * @param tzktConnection TzKT websocket connection
 * @param sender The sender of the operation. It is recommended to specify it to increase performance
 * @param types The types of operations to confirm. It is recommended to specify them to increase performance
 * @param signal Abort signal
 * @returns A promise that resolves to an array of confirmed operations or rejects on timeout, abortion, failed
 * operations or other errors
 */
export async function confirmOperationWithTzkt(
  opHash: string,
  tzktConnection: TzktHubConnection,
  sender?: string,
  types?: TzktOperationType[],
  signal?: AbortSignal
): Promise<TzktOperation[]> {
  let signalCheckInterval: NodeJS.Timer | undefined;
  let confirmationErrorTimeout: NodeJS.Timeout | undefined;
  let operationsCallback: ((ops: TzktOperationsSubscriptionMessage) => void) | undefined;

  const clearJob = () => {
    isDefined(signalCheckInterval) && clearInterval(signalCheckInterval);
    isDefined(confirmationErrorTimeout) && clearTimeout(confirmationErrorTimeout);
    isDefined(operationsCallback) && tzktConnection.off(TzktSubscriptionChannel.Operations, operationsCallback);
  };

  return Promise.race([
    new Promise<TzktOperation[]>((_, reject) => {
      confirmationErrorTimeout = setTimeout(() => {
        clearJob();
        reject(new Error('Confirmation polling timed out'));
      }, CONFIRM_TIMEOUT);
    }),
    new Promise<TzktOperation[]>((_, reject) => {
      signalCheckInterval = setInterval(() => {
        if (signal?.aborted) {
          clearJob();
          reject(new Error('Cancelled'));
        }
      }, 1000);
    }),
    new Promise<TzktOperation[]>(async (resolve, reject) => {
      const handleRelevantOperations = (operations: TzktOperation[]) => {
        const failedOperation = operations.find(op => op.status && op.status !== 'applied');

        if (failedOperation) {
          clearJob();
          reject(new FailedOpError(`Operation ${failedOperation.status}`));
        } else if (operations.length) {
          clearJob();
          resolve(operations);
        }
      };

      try {
        operationsCallback = (msg: TzktOperationsSubscriptionMessage) => {
          if (msg.type === TzktSubscriptionStateMessageType.Data) {
            handleRelevantOperations(msg.data.filter(op => op.hash === opHash));
          }
        };
        tzktConnection.on(TzktSubscriptionChannel.Operations, operationsCallback);
        await tzktConnection.invoke(TzktSubscriptionMethod.SubscribeToOperations, {
          types: types?.join(',') ?? ALL_COMMA_SEPARATED_OPERATION_TYPES,
          address: sender ?? null
        });
        try {
          handleRelevantOperations(
            await fetchGetOperationsByHashWithBaseUrl(getApiBaseURL(tzktConnection.baseUrl), opHash)
          );
        } catch (e) {
          console.error(e);
        }
      } catch (e) {
        reject(e);
      }
    })
  ]);
}

export async function confirmOperation(
  tezos: TezosToolkit,
  opHash: string,
  { initializedAt, fromBlockLevel, signal }: ConfirmOperationOptions = {}
): Promise<OperationEntry> {
  if (!initializedAt) initializedAt = Date.now();
  if (initializedAt && initializedAt + CONFIRM_TIMEOUT < Date.now()) {
    throw new Error('Confirmation polling timed out');
  }

  const startedAt = Date.now();
  let currentBlockLevel;

  try {
    const currentBlock = await tezos.rpc.getBlock();
    currentBlockLevel = currentBlock.header.level;

    for (let i = fromBlockLevel ?? currentBlockLevel; i <= currentBlockLevel; i++) {
      const block = i === currentBlockLevel ? currentBlock : await tezos.rpc.getBlock({ block: i as any });

      const opEntry = await findOperation(block, opHash);
      if (opEntry) {
        return formatOperationEntry(opEntry);
      }
    }
  } catch (err: any) {
    console.error(err);

    if (err instanceof FailedOpError) {
      throw err;
    }
  }

  if (signal?.aborted) {
    throw new Error('Cancelled');
  }

  const timeToWait = Math.max(startedAt + SYNC_INTERVAL - Date.now(), 0);
  await delay(timeToWait);

  return confirmOperation(tezos, opHash, {
    initializedAt,
    fromBlockLevel: currentBlockLevel ? currentBlockLevel + 1 : fromBlockLevel,
    signal
  });
}

async function findOperation(block: BlockResponse, opHash: string) {
  for (let i = 3; i >= 0; i--) {
    for (const op of block.operations[i]) {
      if (op.hash === opHash) {
        return op;
      }
    }
  }
  return null;
}

export class FailedOpError extends Error {}

const formatOperationEntry = (opEntry: OperationEntry) => {
  let status;
  try {
    status = (opEntry.contents[0] as any).metadata.operation_result.status;
  } catch {}
  if (status && status !== 'applied') {
    throw new FailedOpError(`Operation ${status}`);
  }

  return opEntry;
};
