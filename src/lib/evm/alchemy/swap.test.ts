import { decodeFunctionData, erc20Abi, zeroAddress } from 'viem';

import { getEvmStepTransaction } from 'lib/apis/temple/endpoints/evm';
import { getViemPublicClient } from 'temple/evm';

import { buildAlchemySwapCalls, canBatchLifiSteps } from './swap';

jest.mock('lib/apis/temple/endpoints/evm', () => ({ getEvmStepTransaction: jest.fn() }));
jest.mock('temple/evm', () => ({ getViemPublicClient: jest.fn() }));

import { account, target, makeStep as step } from './test-fixtures';
const network = { chainId: 1, rpcBaseURL: 'https://example.test' };
const readContract = jest.fn();
const prepareStep = getEvmStepTransaction as jest.MockedFunction<typeof getEvmStepTransaction>;

beforeEach(() => {
  jest.resetAllMocks();
  readContract.mockResolvedValue(0n);
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

it('omits approval for native tokens', async () => {
  const native = step();
  native.action.fromToken.address = zeroAddress;
  expect((await buildAlchemySwapCalls([native], account, network)).calls).toHaveLength(1);
  expect(readContract).not.toHaveBeenCalled();
});

it('rejects multiple top-level steps', async () => {
  expect(canBatchLifiSteps([step(), step(10)])).toBe(false);
  await expect(buildAlchemySwapCalls([step(), step(10)], account, network)).rejects.toThrow('one LiFi step');
});
it('accepts one bridge step with internal destination-chain execution', async () => {
  const bridge = step(10);
  bridge.includedSteps = [{ ...step(10), type: 'swap', action: { ...step(10).action, fromChainId: 10 } }];
  expect(canBatchLifiSteps([bridge])).toBe(true);
  await expect(buildAlchemySwapCalls([bridge], account, network)).resolves.toBeDefined();
});
it.each(['fromToken', 'toToken'] as const)('rejects a changed %s', async field => {
  prepareStep.mockImplementationOnce(async input => ({
    ...input,
    action: { ...input.action, [field]: { ...input.action[field], address: account } }
  }));
  await expect(buildAlchemySwapCalls([step()], account, network)).rejects.toThrow('token pair or chains');
});
it.each(['fromChainId', 'toChainId'] as const)('rejects a changed %s', async field => {
  prepareStep.mockImplementationOnce(async input => ({ ...input, action: { ...input.action, [field]: 10 } }));
  await expect(buildAlchemySwapCalls([step()], account, network)).rejects.toThrow('token pair or chains');
});
it('uses refreshed amounts, recipient, spender, contract, and minimum output', async () => {
  prepareStep.mockImplementationOnce(async input => ({
    ...input,
    action: { ...input.action, fromAmount: '150', toAddress: target },
    estimate: { ...input.estimate, fromAmount: '150', toAmountMin: '140', approvalAddress: account },
    transactionRequest: { ...input.transactionRequest, to: account, value: '0x9' }
  }));
  const { calls, steps } = await buildAlchemySwapCalls([step()], account, network);
  expect(decodeFunctionData({ abi: erc20Abi, data: calls[0].data }).args).toEqual([account, 150n]);
  expect(calls[1]).toEqual({ to: account, value: '0x9', data: '0x1234' });
  expect(steps[0].estimate.toAmountMin).toBe('140');
});
it('rejects an invalid approval address', async () => {
  prepareStep.mockImplementationOnce(async input => ({
    ...input,
    estimate: { ...input.estimate, approvalAddress: 'invalid' }
  }));
  await expect(buildAlchemySwapCalls([step()], account, network)).rejects.toThrow('invalid approval');
});
it('rejects a transaction on another chain', async () => {
  prepareStep.mockImplementationOnce(async input => ({
    ...input,
    transactionRequest: { ...input.transactionRequest, chainId: 10 }
  }));
  await expect(buildAlchemySwapCalls([step()], account, network)).rejects.toThrow('invalid transaction');
});
