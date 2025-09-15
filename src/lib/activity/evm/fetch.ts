import { groupBy } from 'lodash';

import { fetchEvmTransactions, fetchSpamContracts } from 'lib/apis/temple/endpoints/evm';
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

  const txPromise = fetchEvmTransactions(accAddress, chainId, contractAddress, olderThanBlockHeight, signal);
  const spamPromise = fetchSpamContracts(chainId, signal);
  const [{ transfers, approvals: allApprovals }, spamContracts] = await Promise.all([txPromise, spamPromise]);

  const spamSet = new Set(spamContracts.map(a => a.toLowerCase()));

  if (!transfers.length && !allApprovals.length) return [];

  const isSpamTransfer = (t: (typeof transfers)[number]) =>
    Boolean(t.rawContract.address && spamSet.has(t.rawContract.address.toLowerCase()));
  const filteredTransfers = transfers.filter(t => !isSpamTransfer(t));
  const filteredApprovals = allApprovals.filter(a => !spamSet.has(a.address.toLowerCase()));

  const groups = Object.entries(groupBy(filteredTransfers, 'hash'));

  return groups.map<EvmActivity>(([hash, transfers]) => {
    const firstTransfer = transfers.at(0)!;

    const approvals = filteredApprovals
      .filter(a => a.transactionHash === hash)
      .map(approval => parseApprovalLog(approval));

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
      blockHeight: `${Number(firstTransfer.blockNum)}`,
      // TODO: substitute real values if necessary
      index: null,
      fee: null,
      value: null
    };
  });
}
