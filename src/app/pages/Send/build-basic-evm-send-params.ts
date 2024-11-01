import { encodeFunctionData, parseEther, parseUnits } from 'viem';

import { EvmTokenMetadata } from 'lib/metadata/types';

interface BasicEvmSendParams {
  to: HexString;
  value: bigint;
  data?: HexString;
}

// TODO: add collectibles support
/**
 * Builds parameters for sending a EVM token or ETH.
 * @param receiver Tokens receiver address.
 * @param amount Amount to send, the default value is one 'atomic' unit.
 * @param tokenMetadata Token metadata. If unspecified, the function returns parameters for sending ETH.
 * @returns Parameters for sending a EVM token or ETH.
 */
export const buildBasicEvmSendParams = async (
  receiver: HexString,
  amount?: string,
  tokenMetadata?: EvmTokenMetadata
): Promise<BasicEvmSendParams> => {
  let value = BigInt(0);
  let data: HexString | undefined;

  if (tokenMetadata) {
    const erc20Abi = await import('lib/abi/erc20.json');
    data = encodeFunctionData({
      abi: Array.from(erc20Abi),
      args: [receiver, amount ? parseUnits(amount, tokenMetadata.decimals ?? 0) : BigInt(1)],
      functionName: 'transfer'
    });
  } else {
    value = amount ? parseEther(amount) : BigInt(1);
  }

  return { to: tokenMetadata?.address ?? receiver, value, data };
};
