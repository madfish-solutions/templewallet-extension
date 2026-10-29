import { Address, InsufficientFundsError, TransactionRequest } from 'viem';

import type { ChainPublicClient } from '.';

export async function assertEvmTransactionBalance(
  client: Pick<ChainPublicClient, 'getBalance'>,
  address: Address,
  transaction: Pick<TransactionRequest, 'gas' | 'gasPrice' | 'maxFeePerGas' | 'value'>
): Promise<void> {
  const { gas, value = 0n } = transaction;
  const feePerGas = transaction.gasPrice ?? transaction.maxFeePerGas;
  if (gas === undefined || feePerGas === undefined) throw new Error('Transaction gas and fee are required');

  const balance = await client.getBalance({ address });
  if (balance < value + gas * feePerGas) throw new InsufficientFundsError();
}
