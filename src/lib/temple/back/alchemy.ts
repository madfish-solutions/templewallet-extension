import { parseAbi, type Hex } from 'viem';
import { entryPoint07Address } from 'viem/account-abstraction';

import { sendAlchemyCalls } from 'lib/apis/temple/endpoints/evm/alchemy-wallet';
import type { AlchemyBatchQuote, AlchemySignedCalls } from 'lib/evm/alchemy/types';
import { getAlchemyMaxCost, validateAlchemyQuote } from 'lib/evm/alchemy/validation';
import { getViemPublicClient } from 'temple/evm';
import type { EvmChain } from 'temple/front';

export async function submitAlchemyBatch(
  account: Hex,
  network: EvmChain,
  quote: AlchemyBatchQuote,
  sign: () => Promise<AlchemySignedCalls>
): Promise<Hex> {
  validateAlchemyQuote(quote);
  const client = getViemPublicClient(network);
  const [balance, deposit] = await Promise.all([
    client.getBalance({ address: account }),
    client.readContract({
      address: entryPoint07Address,
      abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
      functionName: 'balanceOf',
      args: [account]
    })
  ]);
  if (balance < getAlchemyMaxCost(quote, deposit)) throw new Error('Insufficient balance for gas');
  const signed = await sign();
  const { id } = await sendAlchemyCalls(signed);
  return id;
}
