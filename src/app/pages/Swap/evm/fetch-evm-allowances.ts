import { LiFiStep } from '@lifi/sdk';
import { isAddress } from 'viem';

import { erc20AllowanceAbi } from 'lib/abi/erc20';
import { EVM_ZERO_ADDRESS } from 'lib/constants';
import { toBigInt, ZERO } from 'lib/utils/numbers';
import { getViemPublicClient } from 'temple/evm';
import { useAllEvmChains } from 'temple/front';

import { Route3EvmRoute, getCommonStepProps } from '../form/interfaces';

export interface EvmStepAllowance {
  sufficient: boolean;
  onChain: bigint;
}

export const fetchEvmStepsAllowances = (
  steps: Array<LiFiStep | Route3EvmRoute>,
  allEvmChains: ReturnType<typeof useAllEvmChains>
): Promise<EvmStepAllowance[]> =>
  Promise.all(
    steps.map(async step => {
      const { fromChainId, fromToken, fromAmount, fromAddress, approvalAddress } = getCommonStepProps(step);
      const network = allEvmChains[fromChainId];
      const evmToolkit = network ? getViemPublicClient(network) : undefined;

      if (!network || !evmToolkit) return { sufficient: true, onChain: toBigInt(ZERO) };

      if (EVM_ZERO_ADDRESS === fromToken.address) {
        return { sufficient: true, onChain: toBigInt(ZERO) };
      }

      const tokenAddress = fromToken.address;
      const owner = fromAddress ?? '';
      const spender = approvalAddress ?? '';
      if (
        !isAddress(tokenAddress, { strict: false }) ||
        !isAddress(owner, { strict: false }) ||
        !isAddress(spender, { strict: false })
      ) {
        throw new Error('Invalid allowance addresses');
      }

      const onChainAllowance = await evmToolkit.readContract({
        address: tokenAddress,
        abi: [erc20AllowanceAbi],
        functionName: 'allowance',
        args: [owner, spender]
      });

      return {
        sufficient: onChainAllowance >= BigInt(fromAmount),
        onChain: onChainAllowance
      };
    })
  );
