import { Estimate, OpKind, TezosToolkit, WalletParamsWithKind, getRevealFee } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

import { TezosEstimationData } from 'lib/temple/front/estimation-data-providers';
import { mutezToTz } from 'lib/temple/helpers';
import { tezosManagerKeyHasManager } from 'lib/tezos';
import { ZERO } from 'lib/utils/numbers';
import { serializeEstimate } from 'lib/utils/serialize-estimate';
import { AccountForTezos } from 'temple/accounts';

export const makeGetRawOperationEstimate =
  <T extends [account: AccountForTezos, tezos: TezosToolkit, ...unknown[]]>(
    getParams: (...args: T) => Promise<WalletParamsWithKind[]>
  ) =>
  async (...args: T) => {
    const [{ address, ownerAddress }, tezos] = args;
    const walletParams = await getParams(...args);

    return {
      estimations: await tezos.estimate.batch(
        walletParams.map(params => ({ ...params, source: ownerAddress || address }))
      ),
      totalAmountTez: walletParams.reduce(
        (acc, op) => (op.kind === OpKind.TRANSACTION ? acc.plus(op.mutez ? mutezToTz(op.amount) : op.amount) : acc),
        ZERO
      )
    };
  };

export const makeEstimateOperation =
  <T extends unknown[], U extends T>(
    getRawEstimate: (
      account: AccountForTezos,
      tezos: TezosToolkit,
      ...args: U
    ) => Promise<{ estimations: Estimate[]; totalAmountTez: BigNumber }>,
    assertArgs: (args: T) => asserts args is U,
    handleError: (error: any) => TezosEstimationData
  ) =>
  async (account: AccountForTezos, tezos: TezosToolkit, balance: BigNumber, ...args: T) => {
    assertArgs(args);

    try {
      const { ownerAddress, address: accountPkh } = account;
      const [{ estimations, totalAmountTez }, manager] = await Promise.all([
        getRawEstimate(account, tezos, ...args),
        tezos.rpc.getManagerKey(ownerAddress || accountPkh)
      ]);
      const [estimation] = estimations;
      const { burnFeeMutez, suggestedFeeMutez } = estimation;

      const revealFeeMutez =
        tezosManagerKeyHasManager(manager) || ownerAddress ? ZERO : mutezToTz(getRevealFee(accountPkh));
      const estimatedBaseFee = mutezToTz(burnFeeMutez + suggestedFeeMutez).plus(revealFeeMutez);

      if (estimatedBaseFee.plus(totalAmountTez).isGreaterThanOrEqualTo(balance)) {
        throw new Error('Not enough funds');
      }

      return {
        baseFee: estimatedBaseFee,
        gasFee: mutezToTz(suggestedFeeMutez).plus(revealFeeMutez),
        revealFee: revealFeeMutez,
        estimates: [serializeEstimate(estimation)]
      };
    } catch (err: any) {
      return handleError(err);
    }
  };
