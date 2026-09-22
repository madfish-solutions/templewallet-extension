import type { LiFiStep } from '@lifi/sdk';
import BigNumber from 'bignumber.js';

import { tokensToAtoms } from 'lib/temple/helpers';
import type { EvmChain } from 'temple/front';
import type { AssetsAmounts } from 'temple/types';

import { isLifiStep, type Route3EvmRoute } from '../../form/interfaces';

export const getBalancesChanges = (
  routeStep: LiFiStep | Route3EvmRoute,
  inputTokenSlug: string,
  outputTokenSlug: string,
  outputNetwork: EvmChain,
  destinationChainGasTokenAmount?: BigNumber
) => {
  let input: AssetsAmounts;
  let output: AssetsAmounts;
  if (isLifiStep(routeStep)) {
    input = {
      [inputTokenSlug]: { atomicAmount: new BigNumber(routeStep.estimate.fromAmount).negated(), isNft: false }
    };

    output = {
      [outputTokenSlug]: { atomicAmount: new BigNumber(routeStep.estimate.toAmount), isNft: false }
    };

    if (destinationChainGasTokenAmount?.gt(0) && outputNetwork?.currency.address) {
      output[outputNetwork.currency.address] = {
        atomicAmount: tokensToAtoms(destinationChainGasTokenAmount, outputNetwork.currency.decimals),
        isNft: false
      };
    }
  } else {
    input = {
      [inputTokenSlug]: { atomicAmount: new BigNumber(routeStep.fromAmount).negated(), isNft: false }
    };
    output = {
      [outputTokenSlug]: { atomicAmount: new BigNumber(routeStep.toAmount), isNft: false }
    };
  }

  return [input, output];
};
