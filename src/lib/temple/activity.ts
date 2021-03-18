import BigNumber from "bignumber.js";
import { OperationContentsAndResult, OpKind } from "@taquito/rpc";
import * as Repo from "lib/temple/repo";
import { BcdTokenTransfer, getTokenTransfers } from "lib/better-call-dev";
import { TzktOperation, getOperations } from "lib/tzkt";

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
      if (new BigNumber(op.balance).isPositive()) {
        assetIdSet.add("tez");
      }
    } else if (op.kind === OpKind.TRANSACTION) {
      if (new BigNumber(op.amount).isPositive()) {
        assetIdSet.add("tez");
      }

      if (op.parameters) {
        // Parse FA2 Transfer
        try {
          const { entrypoint, value } = op.parameters;
          if (entrypoint === "transfer") {
            for (const { args: x } of value as any) {
              if (typeof x[0].string === "string") {
                memberSet.add(x[0].string);
              }
              for (const { args: y } of x[1]) {
                if (typeof y[0].string === "string") {
                  memberSet.add(y[0].string);
                }
                if (typeof y[1].args[0].int === "string") {
                  assetIdSet.add(toTokenId(op.destination, y[1].args[0].int));
                }
              }
            }
          }
        } catch {}

        // Parse FA1.2 Transfer
        try {
          const { entrypoint, value } = op.parameters;
          if (entrypoint === "transfer") {
            const { args: x } = value as any;
            if (typeof x[0].string === "string") {
              memberSet.add(x[0].string);
            }
            const { args: y } = x[1];
            if (typeof y[0].string === "string") {
              memberSet.add(y[0].string);
            }
            if (typeof y[1].int === "string") {
              assetIdSet.add(toTokenId(op.destination));
            }
          }
        } catch {}
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

export async function syncOperations(
  type: "new" | "old",
  chainId: string,
  address: string
) {
  const [[tzktTime], [bcdTime]] = await Promise.all(
    ["tzkt", "bcd"].map((service) =>
      Repo.syncTimes.where({ service, chainId, address }).toArray()
    )
  );

  const operations = await getOperations(chainId as any, {
    address,
    from: new Date().toISOString(),
    to: new Date().toISOString(),
  });
}

export async function syncTzktOperations(chainId: string, address: string) {
  const [time] = await Repo.syncTimes
    .where({ service: "tzkt", chainId, address })
    .toArray();

  let from, to: string;
  if (time) {
    // from = time.higherTimestamp;
    // to = time.lowerTimestamp;
  } else {
    // from = time.higherTimestamp;
    // to = time.higher
  }

  // return operations.map(op => op.id);
}

function toTokenId(contractAddress: string, tokenId: string | number = 0) {
  return `${contractAddress}_${tokenId}`;
}
