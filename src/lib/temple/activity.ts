import { OperationContentsAndResult, OpKind } from "@taquito/rpc";
import BigNumber from "bignumber.js";

import {
  BcdTokenTransfer,
  getTokenTransfers,
  BcdNetwork,
  BCD_NETWORKS_NAMES,
} from "lib/better-call-dev";
import * as Repo from "lib/temple/repo";
import { TZKT_API_BASE_URLS, getOperations } from "lib/tzkt";

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
  let query = Repo.operations.where({ chainId, members: address });

  if (assetIds) {
    query = query.filter((o) =>
      o.assetIds.some((aId) => assetIds.includes(aId))
    );
  }
  if (offset) {
    query = query.offset(offset);
  }
  if (limit) {
    query = query.limit(limit);
  }

  return query.reverse().sortBy("addedAt");
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

export function isSyncSupported(chainId: string) {
  return (
    TZKT_API_BASE_URLS.has(chainId as any) &&
    BCD_NETWORKS_NAMES.has(chainId as any)
  );
}

export async function syncOperations(
  type: "new" | "old",
  chainId: string,
  address: string
) {
  if (!isSyncSupported(chainId)) {
    throw new Error("Not supported for this chainId");
  }

  return Repo.db.transaction(
    "rw",
    Repo.syncTimes,
    Repo.operations,
    async () => {
      const [tzktTime, bcdTime] = await Promise.all(
        ["tzkt", "bcd"].map((service) =>
          Repo.syncTimes.get({ service, chainId, address })
        )
      );

      const fresh = type === "new";
      const bcdNetwork = BCD_NETWORKS_NAMES.get(chainId as any)!;

      const [tzktOperations, bcdTokenTransfers] = await Repo.waitFor(
        Promise.all([
          getOperations(chainId as any, {
            address,
            sort: 1,
            limit: 1000,
            [fresh ? "from" : "to"]:
              tzktTime &&
              new Date(
                fresh ? tzktTime.higherTimestamp + 1 : tzktTime.lowerTimestamp
              ).toISOString(),
          }),
          getTokenTransfers({
            network: bcdNetwork,
            address,
            sort: "desc",
            [fresh ? "start" : "end"]:
              bcdTime &&
              new BigNumber(
                fresh ? bcdTime.higherTimestamp + 1_000 : bcdTime.lowerTimestamp
              )
                .idiv(1_000)
                .toNumber(),
          }),
        ])
      );

      /**
       * TZKT
       */

      for (const tzktOp of tzktOperations) {
        const current = await Repo.operations.get(tzktOp.hash);

        const memberSet = new Set(current?.members);
        const assetIdSet = new Set(current?.assetIds);

        if (
          (tzktOp.type === "transaction" || tzktOp.type === "delegation") &&
          tzktOp.amount &&
          isPositiveNumber(tzktOp.amount)
        ) {
          assetIdSet.add("tez");
        }

        if (tzktOp.type === "transaction") {
          memberSet.add(tzktOp.sender.address);
          memberSet.add(tzktOp.target.address);

          if (tzktOp.parameters) {
            try {
              tryParseTokenTransfers(
                JSON.parse(tzktOp.parameters),
                tzktOp.target.address,
                {
                  onMember: (member) => memberSet.add(member),
                  onAssetId: (assetId) => assetIdSet.add(assetId),
                }
              );
            } catch {}
          }
        } else if (tzktOp.type === "delegation") {
          if (tzktOp.initiator) {
            memberSet.add(tzktOp.initiator.address);
          }
          if (tzktOp.newDelegate) {
            memberSet.add(tzktOp.newDelegate.address);
          }
        }

        const members = Array.from(memberSet);
        const assetIds = Array.from(assetIdSet);

        if (!current) {
          await Repo.operations.add({
            hash: tzktOp.hash,
            chainId,
            members,
            assetIds,
            addedAt: +new Date(tzktOp.timestamp),
            data: {
              tzktGroup: [tzktOp],
            },
          });
        } else {
          await Repo.operations.where({ hash: tzktOp.hash }).modify((op) => {
            op.members = members;
            op.assetIds = assetIds;

            if (!op.data.tzktGroup) {
              op.data.tzktGroup = [tzktOp];
            } else if (op.data.tzktGroup.every((tOp) => tOp.id !== tzktOp.id)) {
              op.data.tzktGroup.push(tzktOp);
            }
          });
        }
      }

      if (tzktOperations.length > 0) {
        const higherTimestamp = +new Date(tzktOperations[0]?.timestamp);
        const lowerTimestamp = +new Date(
          tzktOperations[tzktOperations.length - 1]?.timestamp
        );

        if (!tzktTime) {
          await Repo.syncTimes.add({
            service: "tzkt",
            chainId,
            address,
            higherTimestamp,
            lowerTimestamp,
          });
        } else {
          await Repo.syncTimes
            .where({ service: "tzkt", chainId, address })
            .modify((st) => {
              if (fresh) {
                st.higherTimestamp = higherTimestamp;
              } else {
                st.lowerTimestamp = lowerTimestamp;
              }
            });
        }
      }

      /**
       * BCD
       */

      const tokenTransfers = bcdTokenTransfers.transfers;

      for (const tokenTrans of tokenTransfers) {
        const current = await Repo.operations.get(tokenTrans.hash);

        const memberSet = new Set(current?.members);
        const assetIdSet = new Set(current?.assetIds);

        memberSet.add(tokenTrans.initiator);
        memberSet.add(tokenTrans.to);

        assetIdSet.add(toTokenId(tokenTrans.contract, tokenTrans.token_id));

        const members = Array.from(memberSet);
        const assetIds = Array.from(assetIdSet);

        if (!current) {
          await Repo.operations.add({
            hash: tokenTrans.hash,
            chainId,
            members,
            assetIds,
            addedAt: +new Date(tokenTrans.timestamp),
            data: {
              bcdTokenTransfers: [tokenTrans],
            },
          });
        } else {
          await Repo.operations
            .where({ hash: tokenTrans.hash })
            .modify((op) => {
              op.members = members;
              op.assetIds = assetIds;

              if (!op.data.bcdTokenTransfers) {
                op.data.bcdTokenTransfers = [tokenTrans];
              } else if (
                op.data.bcdTokenTransfers.every(
                  (trans) =>
                    getBcdTokenTransferId(trans) !==
                    getBcdTokenTransferId(tokenTrans)
                )
              ) {
                op.data.bcdTokenTransfers.push(tokenTrans);
              }
            });
        }
      }

      if (tokenTransfers.length > 0) {
        const higherTimestamp = +new Date(tokenTransfers[0]?.timestamp);
        const lowerTimestamp = +new Date(
          tokenTransfers[tokenTransfers.length - 1]?.timestamp
        );

        if (!tzktTime) {
          await Repo.syncTimes.add({
            service: "bcd",
            chainId,
            address,
            higherTimestamp,
            lowerTimestamp,
          });
        } else {
          await Repo.syncTimes
            .where({ service: "bcd", chainId, address })
            .modify((st) => {
              if (fresh) {
                st.higherTimestamp = higherTimestamp;
              } else {
                st.lowerTimestamp = lowerTimestamp;
              }
            });
        }
      }
      return tzktOperations.length + tokenTransfers.length;
    }
  );
}

export const BCD_NETWORKS = new Map<string, BcdNetwork>([
  ["NetXdQprcVkpaWU", "mainnet"],
  ["NetXSgo1ZT2DRUG", "edo2net"],
]);

function tryParseTokenTransfers(
  parameters: any,
  destination: string,
  opts: {
    onMember: (member: string) => void;
    onAssetId: (assetId: string) => void;
  }
) {
  // FA1.2
  try {
    const { entrypoint, value } = parameters;
    if (entrypoint === "transfer") {
      const { args: x } = value as any;
      if (typeof x[0].string === "string") {
        opts.onMember(x[0].string);
      }
      const { args: y } = x[1];
      if (typeof y[0].string === "string") {
        opts.onMember(y[0].string);
      }
      if (typeof y[1].int === "string") {
        opts.onAssetId(toTokenId(destination));
      }
    }
  } catch {}

  // FA2
  try {
    const { entrypoint, value } = parameters;
    if (entrypoint === "transfer") {
      for (const { args: x } of value as any) {
        if (typeof x[0].string === "string") {
          opts.onMember(x[0].string);
        }
        for (const { args: y } of x[1]) {
          if (typeof y[0].string === "string") {
            opts.onMember(y[0].string);
          }
          if (typeof y[1].args[0].int === "string") {
            opts.onAssetId(toTokenId(destination, y[1].args[0].int));
          }
        }
      }
    }
  } catch {}
}

function isPositiveNumber(val: BigNumber.Value) {
  return new BigNumber(val).isGreaterThan(0);
}

function toTokenId(contractAddress: string, tokenId: string | number = 0) {
  return `${contractAddress}_${tokenId}`;
}

function getBcdTokenTransferId(tokenTrans: BcdTokenTransfer) {
  return `${tokenTrans.hash}_${tokenTrans.nonce}`;
}
