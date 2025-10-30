import { LiFiStep } from '@lifi/sdk';
import BigNumber from 'bignumber.js';

import { atomsToTokens } from 'lib/temple/helpers';
import { ZERO } from 'lib/utils/numbers';
import { EvmChain } from 'temple/front/chains';

export const getProtocolFeeForRouteStep = (swapStep: LiFiStep, network: EvmChain) => {
  const feeCosts = swapStep?.estimate?.feeCosts;
  if (!feeCosts?.length) return;

  const protocolFeeRaw = feeCosts
    .filter(fee => !fee.included)
    .reduce((sum, fee) => sum.plus(BigNumber(fee.amount)), ZERO);

  if (protocolFeeRaw.isZero()) return;

  const decimals = network?.currency.decimals ?? 0;
  return atomsToTokens(protocolFeeRaw, decimals).toFixed();
};
