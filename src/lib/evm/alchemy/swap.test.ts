import type { LiFiStep } from '@lifi/sdk';
import { decodeFunctionData, erc20Abi, zeroAddress } from 'viem';

import { getEvmStepTransaction } from 'lib/apis/temple/endpoints/evm';
import { getViemPublicClient } from 'temple/evm';

import { buildAlchemySwapCalls, canBatchLifiSteps } from './swap';

jest.mock('lib/apis/temple/endpoints/evm', () => ({ getEvmStepTransaction: jest.fn() }));
jest.mock('temple/evm', () => ({ getViemPublicClient: jest.fn() }));

const account = '0x1111111111111111111111111111111111111111';
const token = '0x2222222222222222222222222222222222222222';
const target = '0x3333333333333333333333333333333333333333';
const network = { chainId: 1, rpcBaseURL: 'https://example.test' };
const readContract = jest.fn();
const prepareStep = getEvmStepTransaction as jest.MockedFunction<typeof getEvmStepTransaction>;

function step(destination = 1): LiFiStep {
  return {
    includedSteps: [],
    id: `step-${destination}`,
    type: 'lifi',
    tool: 'test',
    toolDetails: { key: 'test', name: 'test', logoURI: '' },
    action: {
      fromChainId: 1,
      toChainId: destination,
      fromAmount: '100',
      fromAddress: account,
      toAddress: account,
      fromToken: { address: token, chainId: 1, decimals: 6, symbol: 'T', name: 'Token', priceUSD: '1' },
      toToken: { address: token, chainId: destination, decimals: 6, symbol: 'T', name: 'Token', priceUSD: '1' },
      slippage: 0.01
    },
    estimate: {
      tool: 'test',
      approvalAddress: target,
      fromAmount: '100',
      toAmount: '99',
      toAmountMin: '98',
      executionDuration: 10
    },
    transactionRequest: { chainId: 1, from: account, to: target, data: '0x1234', value: '0x5', gasLimit: '1000' }
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  (getViemPublicClient as unknown as jest.Mock).mockReturnValue({ readContract });
  prepareStep.mockImplementation(async input => input);
});

it('batches approval and exact LiFi transaction fields', async () => {
  readContract.mockResolvedValue(0n);
  const { calls } = await buildAlchemySwapCalls([step()], account, network);
  expect(calls).toHaveLength(2);
  expect(decodeFunctionData({ abi: erc20Abi, data: calls[0].data }).args).toEqual([target, 100n]);
  expect(calls[1]).toEqual({ to: target, data: '0x1234', value: '0x5' });
});

it('omits approval when the current allowance covers the input', async () => {
  readContract.mockResolvedValue(100n);
  expect((await buildAlchemySwapCalls([step()], account, network)).calls).toHaveLength(1);
});

it('resets an insufficient nonzero allowance within the same batch', async () => {
  readContract.mockResolvedValue(10n);
  const { calls } = await buildAlchemySwapCalls([step()], account, network);
  expect(calls).toHaveLength(3);
  expect(decodeFunctionData({ abi: erc20Abi, data: calls[0].data }).args).toEqual([target, 0n]);
});

it('accounts for allowance consumption across a swap and bridge', async () => {
  readContract.mockResolvedValue(100n);
  const { calls } = await buildAlchemySwapCalls([step(), step(10)], account, network);
  expect(calls).toHaveLength(3);
  expect(readContract).toHaveBeenCalledTimes(1);
  expect(decodeFunctionData({ abi: erc20Abi, data: calls[1].data }).args).toEqual([target, 100n]);
});

it('omits approval for native tokens', async () => {
  const native = step();
  native.action.fromToken.address = zeroAddress;
  expect((await buildAlchemySwapCalls([native], account, network)).calls).toHaveLength(1);
  expect(readContract).not.toHaveBeenCalled();
});

it('rejects destination-chain execution and changed minimum output', async () => {
  const later = step();
  later.action.fromChainId = 10;
  expect(canBatchLifiSteps([step(10), later])).toBe(false);
  await expect(buildAlchemySwapCalls([step(10), later], account, network)).rejects.toThrow('separate chains');
  prepareStep.mockImplementation(async input => ({ ...input, estimate: { ...input.estimate, toAmountMin: '97' } }));
  await expect(buildAlchemySwapCalls([step()], account, network)).rejects.toThrow('quote changed');
});
