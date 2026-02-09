import { Estimate, getRevealFee, TezosToolkit, TransferParams } from '@tezos-x/octez.js';
import { ManagerKeyResponse } from '@tezos-x/octez.js-rpc';
import retry from 'async-retry';
import BigNumber from 'bignumber.js';

import { transferImplicit, transferToContract } from 'lib/michelson';
import { loadContract } from 'lib/temple/contract';
import { getHumanErrorMessage } from 'lib/temple/error-messages';
import { ERROR_MESSAGES } from 'lib/temple/error-messages/messages';
import { mutezToTz, tzToMutez } from 'lib/temple/helpers';
import { TempleAccountType } from 'lib/temple/types';
import { isTezosContractAddress, tezosManagerKeyHasManager } from 'lib/tezos';
import { parseTransferParamsToParamsWithKind } from 'lib/utils/parse-transfer-params';
import { AccountForTezos } from 'temple/accounts';

export const getMaxAmountFiat = (assetPrice: number | null, maxAmountAsset: BigNumber) =>
  assetPrice ? maxAmountAsset.times(assetPrice).decimalPlaces(2, BigNumber.ROUND_FLOOR) : new BigNumber(0);

type TransferParamsInvariant =
  | TransferParams
  | {
      to: string;
      amount: any;
    };

export const estimateTezosMaxFee = (
  acc: AccountForTezos,
  tez: boolean,
  tezos: TezosToolkit,
  from: string,
  to: string,
  balanceBN: BigNumber,
  transferParams: TransferParamsInvariant,
  manager: ManagerKeyResponse
) =>
  retry(
    async (bail): Promise<Estimate> => {
      try {
        const estimateTransfer = async (
          params: TransferParamsInvariant,
          accountIsRevealed = tezosManagerKeyHasManager(manager)
        ) => {
          const batchEstimations = await tezos.estimate.batch([parseTransferParamsToParamsWithKind(params)]);

          return batchEstimations[accountIsRevealed ? 0 : 1];
        };
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
          estmtnMax = await estimateTransfer({ to, amount: amountMax.toString() as any });
        } else {
          estmtnMax = await estimateTransfer(transferParams);
        }
        return estmtnMax;
      } catch (err) {
        const humanErrorMessage = getHumanErrorMessage(err);
        if (humanErrorMessage !== ERROR_MESSAGES.nonceTooHigh && humanErrorMessage !== ERROR_MESSAGES.nonceTooLow) {
          // @ts-expect-error
          return bail(err as Error);
        }

        throw err;
      }
    },
    { retries: 3, minTimeout: 1000, maxTimeout: 1000 }
  );
