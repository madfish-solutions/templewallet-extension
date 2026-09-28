import { ManagerKeyResponse } from '@taquito/rpc';
import { Estimate, getRevealFee, TezosToolkit, TransferParams } from '@taquito/taquito';
import { Mutex } from 'async-mutex';
import retry from 'async-retry';
import BigNumber from 'bignumber.js';

import { toError } from 'lib/analytics';
import { transferImplicit, transferToContract } from 'lib/michelson';
import { loadContract } from 'lib/temple/contract';
import { getHumanErrorMessage } from 'lib/temple/error-messages';
import { ERROR_MESSAGES } from 'lib/temple/error-messages/messages';
import { mutezToTz, tzToMutez } from 'lib/temple/helpers';
import { TempleAccountType } from 'lib/temple/types';
import { isTezosContractAddress, isTransientTezosRpcError, tezosManagerKeyHasManager } from 'lib/tezos';
import { parseTransferParamsToParamsWithKind } from 'lib/utils/parse-transfer-params';
import { AccountForTezos } from 'temple/accounts';

export const getMaxAmountFiat = (assetPrice: number | null, maxAmountAsset: BigNumber) =>
  assetPrice ? maxAmountAsset.times(assetPrice).decimalPlaces(2, BigNumber.ROUND_FLOOR) : new BigNumber(0);

// Taquito keeps one counter map per toolkit; two concurrent prepares on the same toolkit hand out head+1 and head+2
const toolkitEstimationMutexes = new WeakMap<TezosToolkit, Mutex>();

const getToolkitEstimationMutex = (tezos: TezosToolkit) => {
  const mutex = toolkitEstimationMutexes.get(tezos) ?? new Mutex();
  toolkitEstimationMutexes.set(tezos, mutex);

  return mutex;
};

const isRetryableEstimationError = (error: unknown) => {
  const humanErrorMessage = getHumanErrorMessage(error);

  return (
    humanErrorMessage === ERROR_MESSAGES.nonceTooHigh ||
    humanErrorMessage === ERROR_MESSAGES.nonceTooLow ||
    isTransientTezosRpcError(error)
  );
};

export const estimateTezosMaxFee = (
  acc: AccountForTezos,
  tez: boolean,
  tezos: TezosToolkit,
  from: string,
  to: string,
  balanceBN: BigNumber,
  transferParams: TransferParams,
  manager: ManagerKeyResponse
) =>
  retry(
    async (bail): Promise<Estimate> => {
      try {
        const estimateTransfer = (params: TransferParams, accountIsRevealed = tezosManagerKeyHasManager(manager)) =>
          getToolkitEstimationMutex(tezos).runExclusive(async () => {
            const batchEstimations = await tezos.estimate.batch([parseTransferParamsToParamsWithKind(params)]);
            const estimate = batchEstimations.at(accountIsRevealed ? 0 : 1);

            if (!estimate) throw new Error('Estimation returned no result');

            return estimate;
          });
        let estmtnMax: Estimate;
        if (acc.type === TempleAccountType.ManagedKT) {
          const michelsonLambda = isTezosContractAddress(to) ? transferToContract : transferImplicit;

          const contract = await loadContract(tezos, acc.address);
          const transferParamsWrapper = contract.methodsObject
            .do(michelsonLambda(to, tzToMutez(balanceBN)))
            .toTransferParams();
          estmtnMax = await estimateTransfer(transferParamsWrapper, true);
        } else if (tez) {
          const estmtn = await estimateTransfer(transferParams);
          let amountMax = balanceBN.minus(mutezToTz(estmtn.totalCost));
          if (!tezosManagerKeyHasManager(manager)) {
            amountMax = amountMax.minus(mutezToTz(getRevealFee(from)));
          }
          estmtnMax = await estimateTransfer({ to, amount: tzToMutez(amountMax).toNumber(), mutez: true });
        } else {
          estmtnMax = await estimateTransfer(transferParams);
        }
        return estmtnMax;
      } catch (err) {
        if (!isRetryableEstimationError(err)) {
          // @ts-expect-error
          return bail(toError(err));
        }

        throw err;
      }
    },
    { retries: 3, minTimeout: 1000, maxTimeout: 1000 }
  );
