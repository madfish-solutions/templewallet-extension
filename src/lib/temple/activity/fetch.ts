import { OperationContentsAndResult, OpKind } from "@taquito/rpc";

import * as Repo from "lib/temple/repo";

import { isPositiveNumber, tryParseTokenTransfers } from "./helpers";

export type FetchOperationsParams = {
  chainId: string;
  address: string;
  assetIds?: string[];
  offset?: number;
  limit?: number;
};

export async function fetchOperations({
  chainId,
  address,
  assetIds,
  offset,
  limit,
}: FetchOperationsParams) {
  // Base
  let query = Repo.operations
    .where("[chainId+addedAt]")
    .between([chainId, 0], [chainId, Date.now()])
    .reverse();

  // Filter by members & assets
  query = query.filter(
    (o) =>
      o.members.includes(address) &&
      (assetIds ? o.assetIds.some((aId) => assetIds.includes(aId)) : true)
  );

  // Sorting
  if (offset) {
    query = query.offset(offset);
  }
  if (limit) {
    query = query.limit(limit);
  }

  return query.toArray();
}

export async function addLocalOperation(
  chainId: string,
  hash: string,
  localGroup: OperationContentsAndResult[]
) {
  const memberSet = new Set<string>();
  const assetIdSet = new Set<string>();

  for (const op of localGroup) {
    // Add sources to members
    switch (op.kind) {
      case OpKind.ACTIVATION:
        memberSet.add(op.pkh);
        break;

      case OpKind.PROPOSALS:
      case OpKind.BALLOT:
      case OpKind.REVEAL:
      case OpKind.TRANSACTION:
      case OpKind.DELEGATION:
      case OpKind.ORIGINATION:
        memberSet.add(op.source);
        break;
    }

    // Add targets to members
    switch (op.kind) {
      case OpKind.TRANSACTION:
        memberSet.add(op.destination);
        break;

      case OpKind.DELEGATION:
        op.delegate && memberSet.add(op.delegate);
        break;
    }

    // Parse asset ids
    if (op.kind === OpKind.ORIGINATION) {
      if (isPositiveNumber(op.balance)) {
        assetIdSet.add("tez");
      }
    } else if (op.kind === OpKind.TRANSACTION) {
      if (isPositiveNumber(op.amount)) {
        assetIdSet.add("tez");
      }

      if (op.parameters) {
        tryParseTokenTransfers(op.parameters, op.destination, {
          onMember: (member) => memberSet.add(member),
          onAssetId: (assetId) => assetIdSet.add(assetId),
        });
      }
    }
  }

  const members = Array.from(memberSet);
  const assetIds = Array.from(assetIdSet);

  return Repo.operations.add({
    hash,
    chainId,
    members,
    assetIds,
    addedAt: Date.now(),
    data: {
      localGroup,
    },
  });
}
