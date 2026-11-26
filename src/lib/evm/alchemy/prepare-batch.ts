import type { LiFiStep } from '@lifi/sdk';
import { numberToHex, type Hex } from 'viem';

import { prepareAlchemyCalls } from 'lib/apis/temple/endpoints/evm/alchemy-wallet';
import type { EvmNetworkEssentials } from 'temple/networks';

import { buildAlchemySwapCalls } from './swap';
import type { AlchemyBatchQuote, AlchemyFeeOption } from './types';
import { ALCHEMY_QUOTE_LIFETIME, addAlchemyGasParamsOverride, validateAlchemyPreparedCalls } from './validation';

export interface PreparedAlchemySwapBatch {
  quote: AlchemyBatchQuote;
  steps: LiFiStep[];
}

export const prepareAlchemySwapBatch = async (
  steps: LiFiStep[],
  account: Hex,
  network: EvmNetworkEssentials,
  feeOption: AlchemyFeeOption,
  signal?: AbortSignal
): Promise<PreparedAlchemySwapBatch> => {
  const result = await buildAlchemySwapCalls(steps, account, network, signal);
  const request = addAlchemyGasParamsOverride(
    { from: account, chainId: numberToHex(network.chainId), calls: result.calls },
    feeOption
  );
  const prepared = await prepareAlchemyCalls(request, signal);
  validateAlchemyPreparedCalls(prepared, request);

  return {
    steps: result.steps,
    quote: {
      request,
      prepared,
      minNativeReceivedByCall: result.minNativeReceivedByCall,
      expiresAt: Date.now() + ALCHEMY_QUOTE_LIFETIME,
      feeOption
    }
  };
};
