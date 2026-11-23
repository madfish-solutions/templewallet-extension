import {
  forgeTezosOperation,
  getTezosFinalOpParams,
  getTotalStorageLimit,
  simulateTezosBalancesChanges
} from 'app/templates/TransactionTabs/tezos-operation';
import { getTezosFeeOption } from 'app/templates/TransactionTabs/utils';
import { DEFAULT_FEE_OPTION } from 'lib/temple/front/estimation-data-providers';
import { AccountForChain } from 'temple/accounts';
import { getTezosToolkitWithSigner } from 'temple/front';
import { TezosNetworkEssentials } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

import { PreparedTezosSwap } from '../types';

import { buildTezosSwapOperations, TezosSwapBuildInput } from './build-swap-operations';
import { estimateTezosSwap } from './estimate-swap';

interface PrepareTezosSwapArgs {
  build: TezosSwapBuildInput;
  network: TezosNetworkEssentials;
  account: AccountForChain<TempleChainKind.Tezos>;
}

export const prepareTezosSwap = async (
  { build, network, account }: PrepareTezosSwapArgs,
  signal: AbortSignal
): Promise<PreparedTezosSwap> => {
  const operations = await buildTezosSwapOperations(build);
  if (!operations) throw new Error('No swap operations were built');
  signal.throwIfAborted();

  const sourcePkh = account.ownerAddress || account.address;
  const tezos = getTezosToolkitWithSigner(network, sourcePkh, true);
  const estimationData = await estimateTezosSwap(tezos, sourcePkh, operations.opParams);
  signal.throwIfAborted();

  const finalOpParams = getTezosFinalOpParams({
    basicParams: operations.opParams,
    estimates: estimationData.estimates,
    revealFee: estimationData.revealFee,
    totalFeeTz: getTezosFeeOption(DEFAULT_FEE_OPTION, estimationData.gasFee),
    storageLimit: '',
    totalDefaultStorageLimit: getTotalStorageLimit(estimationData.estimates)
  });
  const { forgeParams, bytesToSign } = await forgeTezosOperation(
    network,
    account.address,
    await tezos.wallet.pk(),
    finalOpParams
  );
  if (!bytesToSign) throw new Error('The swap operation could not be forged');
  signal.throwIfAborted();

  const balancesChanges = await simulateTezosBalancesChanges(tezos.rpc, network.chainId, forgeParams, account.address);

  return { ...operations, estimationData, balancesChanges, preparedAt: Date.now() };
};
