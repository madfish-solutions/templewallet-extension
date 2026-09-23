import { AlchemyRpcError, sendAlchemyCalls } from 'lib/apis/temple/endpoints/evm/alchemy-wallet';
import { account, makeQuote } from 'lib/evm/alchemy/test-fixtures';
import type { AlchemySignedCalls } from 'lib/evm/alchemy/types';
import { getAlchemyOperation } from 'lib/evm/alchemy/validation';
import { getViemPublicClient } from 'temple/evm';
import type { EvmChain } from 'temple/front';

import { submitAlchemyBatch } from './alchemy';

jest.mock('lib/apis/temple/endpoints/evm/alchemy-wallet', () => ({
  ...jest.requireActual('lib/apis/temple/endpoints/evm/alchemy-wallet'),
  sendAlchemyCalls: jest.fn()
}));
jest.mock('temple/evm', () => ({ getViemPublicClient: jest.fn() }));
const network = { chainId: 1 } as EvmChain;
const readContract = jest.fn();
const getBalance = jest.fn();
const sign = jest.fn();
const send = sendAlchemyCalls as jest.MockedFunction<typeof sendAlchemyCalls>;
const callId = `0x${'ab'.repeat(64)}` as const;
let signed: AlchemySignedCalls;

beforeEach(() => {
  jest.resetAllMocks();
  (getViemPublicClient as unknown as jest.Mock).mockReturnValue({ readContract, getBalance });
  getBalance.mockResolvedValue(5n);
  readContract.mockResolvedValue(60n);
  const operation = getAlchemyOperation(makeQuote().prepared);
  signed = {
    type: operation.type,
    chainId: operation.chainId,
    data: operation.data,
    signature: { type: 'secp256k1', data: `0x${'11'.repeat(65)}` }
  };
  sign.mockResolvedValue(signed);
  send.mockResolvedValue({ id: callId });
});

it('uses the EntryPoint deposit, sends the signed calls once, and returns the call ID', async () => {
  expect(await submitAlchemyBatch(account, network, makeQuote(), sign)).toBe(callId);
  expect(sign).toHaveBeenCalledTimes(1);
  expect(send).toHaveBeenCalledTimes(1);
  expect(send).toHaveBeenCalledWith(signed);
});

it('rejects an insufficient combined balance before a signature', async () => {
  readContract.mockResolvedValue(59n);
  await expect(submitAlchemyBatch(account, network, makeQuote(), sign)).rejects.toThrow('Insufficient balance');
  expect(sign).not.toHaveBeenCalled();
  expect(send).not.toHaveBeenCalled();
});

it('does not allow EntryPoint deposits to fund call values', async () => {
  getBalance.mockResolvedValue(4n);
  readContract.mockResolvedValue(1_000_000n);
  await expect(submitAlchemyBatch(account, network, makeQuote(), sign)).rejects.toThrow('Insufficient balance');
});

it('propagates submission errors without an automatic resend', async () => {
  const error = new AlchemyRpcError(-32000, 'precheck failed: maxFeePerGas too low');
  send.mockRejectedValueOnce(error);
  await expect(submitAlchemyBatch(account, network, makeQuote(), sign)).rejects.toBe(error);
  expect(send).toHaveBeenCalledTimes(1);
});

it('rejects an expired quote before a signature or submission', async () => {
  const quote = { ...makeQuote(), expiresAt: Date.now() - 1 };
  await expect(submitAlchemyBatch(account, network, quote, sign)).rejects.toThrow();
  expect(sign).not.toHaveBeenCalled();
  expect(send).not.toHaveBeenCalled();
});
