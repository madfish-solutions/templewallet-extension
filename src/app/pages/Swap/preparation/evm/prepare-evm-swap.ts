import type { Route as LiFiRoute } from '@lifi/sdk';

import type { AlchemyWalletConfig } from 'lib/evm/alchemy/types';
import { AccountForChain } from 'temple/accounts';
import { TempleChainKind } from 'temple/types';

import { isAlchemyBatchEligible, needsAlchemyWalletConfig } from '../../evm/batch-eligibility';
import { fetchEvmStepsAllowances } from '../../evm/fetch-evm-allowances';
import { buildEvmUserActions } from '../../evm/user-actions';
import { Route3EvmRoute } from '../../form/interfaces';
import { PreparedEvmSwap } from '../types';

import { EvmActionContext, prepareEvmBatchAction, prepareEvmStepAction } from './prepare-evm-action';

interface PrepareEvmSwapArgs {
  account: AccountForChain<TempleChainKind.EVM>;
  route: LiFiRoute | Route3EvmRoute;
  ctx: EvmActionContext;
  getWalletConfig: (signal: AbortSignal) => Promise<AlchemyWalletConfig>;
}

export const prepareEvmSwap = async (
  { account, route, ctx, getWalletConfig }: PrepareEvmSwapArgs,
  signal: AbortSignal
): Promise<PreparedEvmSwap> => {
  const steps = 'steps' in route ? route.steps : [route];
  const walletConfig = needsAlchemyWalletConfig(account.type, steps) ? await getWalletConfig(signal) : null;
  signal.throwIfAborted();

  if (walletConfig && isAlchemyBatchEligible(steps, walletConfig)) {
    const firstAction = await prepareEvmBatchAction(steps, ctx, signal);

    return { path: 'batch', route, walletConfig, firstAction };
  }

  const allowances = await fetchEvmStepsAllowances(steps, ctx.chains);
  signal.throwIfAborted();

  const firstUserAction = buildEvmUserActions(
    steps,
    allowances.map(({ sufficient }) => sufficient),
    allowances.map(({ onChain }) => onChain)
  ).at(0);
  if (!firstUserAction) throw new Error('The route has no actions');

  const firstAction = await prepareEvmStepAction(firstUserAction, ctx, signal);

  return { path: 'steps', route, walletConfig, allowances, firstAction };
};
