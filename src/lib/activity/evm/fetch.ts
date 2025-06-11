import { groupBy } from 'lodash';

import { fetchEvmTransactions } from 'lib/apis/temple/endpoints/evm';
import { fromAssetSlug } from 'lib/assets';
import { TempleChainKind } from 'temple/types';

import { EvmActivity } from '../types';

import { parseApprovalLog, parseTransfer } from './parse';

export async function getEvmActivities(
  chainId: number,
  accAddress: string,
  assetSlug?: string,
  olderThanBlockHeight?: `${number}`,
  signal?: AbortSignal
) {
  const accAddressLowercased = accAddress.toLowerCase();

  const contractAddress = assetSlug ? fromAssetSlug(assetSlug)[0] : undefined;

  const { transfers, approvals: allApprovals } = await fetchEvmTransactions(
    accAddress,
    chainId,
    contractAddress,
    olderThanBlockHeight,
    signal
  );

  if (!transfers.length && !allApprovals.length) return [];

  const groups = Object.entries(groupBy(transfers, 'hash'));

  return groups.map<EvmActivity>(([hash, transfers]) => {
    const firstTransfer = transfers.at(0)!;

    const approvals = allApprovals.filter(a => a.transactionHash === hash).map(approval => parseApprovalLog(approval));

    const operations = transfers
      .map(transfer => parseTransfer(transfer, accAddressLowercased, chainId))
      .concat(approvals)
      .sort((a, b) => a.logIndex - b.logIndex);

    return {
      chain: TempleChainKind.EVM,
      chainId,
      hash,
      // status: Not provided by the API. Those which `failed`, are included still.
      addedAt: firstTransfer.metadata.blockTimestamp,
      operations,
      operationsCount: operations.length,
      blockHeight: `${Number(firstTransfer.blockNum)}`
    };
  });
}
