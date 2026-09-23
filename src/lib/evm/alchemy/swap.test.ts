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

it('credits native output only after its swap call', async () => {
  const first = step();
  first.action.toToken.address = zeroAddress;
  first.estimate.toAmountMin = '100';
  first.transactionRequest!.value = '0x0';
  const second = step();
  second.action.fromToken.address = zeroAddress;
  second.transactionRequest!.value = '0x5a';

  const result = await buildAlchemySwapCalls([first, second], account, network);
  expect(result.calls).toHaveLength(3);
  expect(result.minNativeReceivedByCall).toEqual({ 1: '0x64' });
});

it('uses the sender as the native output recipient when LiFi omits one', async () => {
  const nativeOutput = step();
  nativeOutput.action.toToken.address = zeroAddress;
  nativeOutput.action.toAddress = undefined;

  expect((await buildAlchemySwapCalls([nativeOutput], account, network)).minNativeReceivedByCall).toEqual({
    1: '0x62'
  });
});

it('does not credit native output sent to another account', async () => {
  const nativeOutput = step();
  nativeOutput.action.toToken.address = zeroAddress;
  nativeOutput.action.toAddress = target;

  expect((await buildAlchemySwapCalls([nativeOutput], account, network)).minNativeReceivedByCall).toEqual({});
});

it('does not credit native output on another chain', async () => {
  const bridge = step(10);
  bridge.action.toToken.address = zeroAddress;

  expect((await buildAlchemySwapCalls([bridge], account, network)).minNativeReceivedByCall).toEqual({});
});

it.each([
  ['one swap', [step()]],
  ['one bridge', [step(10)]],
  ['two swaps on one chain', [step(), step()]],
  ['a swap then a bridge', [step(), step(10)]]
] as const)('accepts %s', async (_name, steps) => {
  expect(canBatchLifiSteps([...steps])).toBe(true);
  const result = await buildAlchemySwapCalls([...steps], account, network);
  expect(result.steps).toEqual(steps);
  expect(prepareStep).toHaveBeenCalledTimes(steps.length);
});

it.each([0n, 150n, 200n])('preserves call order and accounts for prior allowance use: %s', async allowance => {
  readContract.mockResolvedValue(allowance);
  const first = step();
  const second = step();
  second.transactionRequest = { ...second.transactionRequest, data: '0x5678' };
  const { calls } = await buildAlchemySwapCalls([first, second], account, network);
  const swap = { to: target, data: '0x1234', value: '0x5' };
  const nextSwap = { ...swap, data: '0x5678' };
  if (allowance === 0n) {
    expect(calls).toHaveLength(4);
    expect(decodeFunctionData({ abi: erc20Abi, data: calls[0].data }).args).toEqual([target, 100n]);
    expect(calls[1]).toEqual(swap);
    expect(decodeFunctionData({ abi: erc20Abi, data: calls[2].data }).args).toEqual([target, 100n]);
    expect(calls[3]).toEqual(nextSwap);
  } else if (allowance === 150n) {
    expect(calls).toHaveLength(4);
    expect(calls[0]).toEqual(swap);
    expect(decodeFunctionData({ abi: erc20Abi, data: calls[1].data }).args).toEqual([target, 0n]);
    expect(decodeFunctionData({ abi: erc20Abi, data: calls[2].data }).args).toEqual([target, 100n]);
    expect(calls[3]).toEqual(nextSwap);
  } else {
    expect(calls).toEqual([swap, nextSwap]);
  }
  expect(readContract).toHaveBeenCalledTimes(1);
});

it('rejects a bridge followed by a destination-chain swap', async () => {
  const destinationSwap = step(10);
  destinationSwap.action.fromChainId = 10;
  const steps = [step(10), destinationSwap];
  expect(canBatchLifiSteps(steps)).toBe(false);
  await expect(buildAlchemySwapCalls(steps, account, network)).rejects.toThrow('separate chains');
  expect(prepareStep).not.toHaveBeenCalled();
});

it('rejects an intermediate bridge even if the next step starts on the source chain', async () => {
  const steps = [step(10), step()];
  expect(canBatchLifiSteps(steps)).toBe(false);
  await expect(buildAlchemySwapCalls(steps, account, network)).rejects.toThrow('separate chains');
  expect(prepareStep).not.toHaveBeenCalled();
});

it('rejects an empty route', async () => {
  expect(canBatchLifiSteps([])).toBe(false);
  await expect(buildAlchemySwapCalls([], account, network)).rejects.toThrow('separate chains');
});

it('rejects a route on a different source network', async () => {
  await expect(buildAlchemySwapCalls([step()], account, { ...network, chainId: 10 })).rejects.toThrow(
    'separate chains'
  );
  expect(prepareStep).not.toHaveBeenCalled();
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
