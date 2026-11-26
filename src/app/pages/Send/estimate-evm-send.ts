import { EvmAssetMetadata } from 'lib/metadata/types';
import { getViemPublicClient } from 'temple/evm';
import { assertEvmTransactionBalance } from 'temple/evm/assert-transaction-balance';
import { EvmEstimationData, estimate as genericEstimate } from 'temple/evm/estimate';
import { EvmNetworkEssentials } from 'temple/networks';

import { buildBasicEvmSendParams } from './build-basic-evm-send-params';

interface EstimateEvmSendArgs {
  network: EvmNetworkEssentials;
  accountPkh: HexString;
  to: HexString;
  assetMetadata: EvmAssetMetadata;
  amount?: string;
}

export const estimateEvmSend = async ({
  network,
  accountPkh,
  to,
  assetMetadata,
  amount
}: EstimateEvmSendArgs): Promise<EvmEstimationData> => {
  const transaction = buildBasicEvmSendParams(accountPkh, to, assetMetadata, amount);
  const estimation = await genericEstimate(network, { ...transaction, from: accountPkh });
  await assertEvmTransactionBalance(getViemPublicClient(network), accountPkh, { ...transaction, ...estimation });

  return estimation;
};
