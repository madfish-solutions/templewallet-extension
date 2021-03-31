import BigNumber from "bignumber.js";
import { OperationContentsAndResult, OpKind } from "@taquito/rpc";
import * as Repo from "lib/temple/repo";
import {
  BcdTokenTransfer,
  getTokenTransfers,
  BcdNetwork,
} from "lib/better-call-dev";
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
      if (isPositiveNumber(op.balance)) {
        assetIdSet.add("tez");
      }
    } else if (op.kind === OpKind.TRANSACTION) {
      if (isPositiveNumber(op.amount)) {
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
  const [tzktTime, bcdTime] = await Promise.all(
    ["tzkt", "bcd"].map((service) =>
      Repo.syncTimes.where({ service, chainId, address }).first()
    )
  );

  const fresh = type === "new";
  const bcdNetwork = BCD_NETWORKS.get(chainId)!;

  const [tzktOperations, bcdTokenTransfers] = await Promise.all([
    getOperations(chainId as any, {
      address,
      [fresh ? "from" : "to"]:
        tzktTime &&
        new Date(
          tzktTime[fresh ? "higherTimestamp" : "lowerTimestamp"]
        ).toISOString(),
    }),
    getTokenTransfers({
      network: bcdNetwork,
      address,
      [fresh ? "start" : "end"]:
        bcdTime && bcdTime[fresh ? "higherTimestamp" : "lowerTimestamp"],
    }),
  ]);

  for (const tzktOp of tzktOperations) {
    const current = await Repo.operations.get(tzktOp.hash);

    // TODO: Reimplement
    const assetIds = [];
    if (
      (tzktOp.type === "transaction" || tzktOp.type === "delegation") &&
      tzktOp.amount &&
      isPositiveNumber(tzktOp.amount)
    ) {
      assetIds.push("tez");
    }

    if (!current) {
      await Repo.operations.add({
        hash: tzktOp.hash,
        chainId,
        members: [tzktOp.sender.address],
        assetIds,
        addedAt: tzktOp.timestamp ? +new Date(tzktOp.timestamp) : Date.now(),
        data: {
          tzktGroup: [tzktOp],
        },
      });
    } else {
      await Repo.operations.where({ hash: tzktOp.hash }).modify((op) => {
        if (!op.members.includes(tzktOp.sender.address)) {
          op.members.push(tzktOp.sender.address);
        }

        // TODO: AssetIds

        if (!op.data.tzktGroup) {
          op.data.tzktGroup = [tzktOp];
        } else if (op.data.tzktGroup.every((tOp) => tOp.id !== tzktOp.id)) {
          op.data.tzktGroup.push(tzktOp);
        }
      });
    }
  }

  for (const tokenTrans of bcdTokenTransfers.transfers) {
    const assetId = toTokenId(tokenTrans.contract, tokenTrans.token_id);
    const current = await Repo.operations.get(tokenTrans.hash);
    if (!current) {
      await Repo.operations.add({
        hash: tokenTrans.hash,
        chainId,
        members: [tokenTrans.initiator, tokenTrans.to],
        assetIds: [assetId],
        addedAt: tokenTrans.indexed_time ?? Date.now(),
        data: {
          bcdTokenTransfers: [tokenTrans],
        },
      });
    } else {
      await Repo.operations.where({ hash: tokenTrans.hash }).modify((op) => {
        if (!op.members.includes(tokenTrans.initiator)) {
          op.members.push(tokenTrans.initiator);
        }
        if (!op.members.includes(tokenTrans.to)) {
          op.members.push(tokenTrans.to);
        }

        if (!op.assetIds.includes(assetId)) {
          op.assetIds.push(assetId);
        }

        if (!op.data.bcdTokenTransfers) {
          op.data.bcdTokenTransfers = [tokenTrans];
        } else if (
          op.data.bcdTokenTransfers.every(
            (trans) =>
              getBcdTokenTransferId(trans) !== getBcdTokenTransferId(tokenTrans)
          )
        ) {
          op.data.bcdTokenTransfers.push(tokenTrans);
        }
      });
    }
  }
}

// export async function syncTzktOperations(chainId: string, address: string) {
//   const [time] = await Repo.syncTimes
//     .where({ service: "tzkt", chainId, address })
//     .toArray();

//   let from, to: string | undefined;
//   if (time) {
//     // from = time.higherTimestamp;
//     // to = time.lowerTimestamp;
//   } else {
//     // from = time.higherTimestamp;
//     // to = time.higher
//   }

//   // return operations.map(op => op.id);
// }

export const BCD_NETWORKS = new Map<string, BcdNetwork>([
  ["NetXdQprcVkpaWU", "mainnet"],
  ["NetXSgo1ZT2DRUG", "edo2net"],
]);

function isPositiveNumber(val: BigNumber.Value) {
  return new BigNumber(val).isGreaterThan(0);
}

function toTokenId(contractAddress: string, tokenId: string | number = 0) {
  return `${contractAddress}_${tokenId}`;
}

function getBcdTokenTransferId(tokenTrans: BcdTokenTransfer) {
  return `${tokenTrans.hash}_${tokenTrans.nonce}`;
}
