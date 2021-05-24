import { OpKind } from "@taquito/rpc";

import * as Repo from "lib/temple/repo";

import { isPositiveNumber, tryParseTokenTransfers } from "./helpers";
import { OpStackItem, OpStackItemType } from "./types";

export function parseOpStack(operation: Repo.IOperation, address: string) {
  const { localGroup, tzktGroup, bcdTokenTransfers } = operation.data;

  const opStack: OpStackItem[] = [];
  const addIfNotExist = (itemToAdd: OpStackItem) => {
    if (opStack.every((item) => !isOpStackItemsEqual(item, itemToAdd))) {
      opStack.push(itemToAdd);
    }
  };

  if (tzktGroup) {
    /**
     * Tzkt group
     */

    for (const tzktOp of tzktGroup) {
      if (
        tzktOp.type === "delegation" &&
        tzktOp.sender.address === address &&
        tzktOp.newDelegate
      ) {
        opStack.push({
          type: OpStackItemType.Delegation,
          to: tzktOp.newDelegate.address,
        });
      } else if (tzktOp.type === "transaction") {
        if (tzktOp.parameters) {
          let parsed;
          try {
            parsed = JSON.parse(tzktOp.parameters);
          } catch {}

          if (parsed) {
            const tokenTransfers: {
              assetId: string;
              from: string;
              to: string;
              amount: string;
            }[] = [];
            tryParseTokenTransfers(
              parsed,
              tzktOp.target.address,
              (assetId, from, to, amount) => {
                tokenTransfers.push({ assetId, from, to, amount });
              }
            );

            if (tokenTransfers.length > 0) {
              for (const tt of tokenTransfers) {
                if (tt.from === address) {
                  opStack.push({
                    type: OpStackItemType.TransferTo,
                    to: tt.to,
                  });
                } else if (tt.to === address) {
                  opStack.push({
                    type: OpStackItemType.TransferFrom,
                    from: tt.from,
                  });
                }
              }
            } else if (tzktOp.sender.address === address) {
              opStack.push({
                type: OpStackItemType.Interaction,
                with: tzktOp.target.address,
                entrypoint: parsed.entrypoint,
              });
            }
          }
        } else if (isPositiveNumber(tzktOp.amount)) {
          if (tzktOp.sender.address === address) {
            opStack.push({
              type: OpStackItemType.TransferTo,
              to: tzktOp.target.address,
            });
          } else if (tzktOp.target.address === address) {
            opStack.push({
              type: OpStackItemType.TransferFrom,
              from: tzktOp.sender.address,
            });
          }
        }
      } else {
        opStack.push({
          type: OpStackItemType.Other,
          name: tzktOp.type,
        });
      }
    }
  } else if (localGroup) {
    /**
     * Local group
     */

    for (const op of localGroup) {
      if (op.kind === OpKind.ORIGINATION) {
        if (op.source === address) {
          const contract =
            op?.metadata?.operation_result?.originated_contracts?.[0];
          opStack.push({
            type: OpStackItemType.Origination,
            contract,
          });
        }
      } else if (op.kind === OpKind.DELEGATION) {
        if (op.source === address && op.delegate) {
          opStack.push({
            type: OpStackItemType.Delegation,
            to: op.delegate,
          });
        }
      } else if (op.kind === OpKind.TRANSACTION) {
        if (op.parameters) {
          const tokenTransfers: {
            assetId: string;
            from: string;
            to: string;
            amount: string;
          }[] = [];
          tryParseTokenTransfers(
            op.parameters,
            op.destination,
            (assetId, from, to, amount) => {
              tokenTransfers.push({ assetId, from, to, amount });
            }
          );

          if (tokenTransfers.length > 0) {
            for (const tt of tokenTransfers) {
              if (tt.from === address) {
                opStack.push({
                  type: OpStackItemType.TransferTo,
                  to: tt.to,
                });
              } else if (tt.to === address) {
                opStack.push({
                  type: OpStackItemType.TransferFrom,
                  from: tt.from,
                });
              }
            }
          } else {
            opStack.push({
              type: OpStackItemType.Interaction,
              with: op.destination,
              entrypoint: op.parameters.entrypoint,
            });
          }
        } else if (isPositiveNumber(op.amount)) {
          if (op.source === address) {
            opStack.push({
              type: OpStackItemType.TransferTo,
              to: op.destination,
            });
          } else if (op.destination === address) {
            opStack.push({
              type: OpStackItemType.TransferFrom,
              from: op.source,
            });
          }
        }
      } else {
        opStack.push({
          type: OpStackItemType.Other,
          name: op.kind,
        });
      }
    }
  }

  if (bcdTokenTransfers) {
    /**
     * BCD token transfers
     */

    for (const tokenTrans of bcdTokenTransfers) {
      if (tokenTrans.from === address) {
        addIfNotExist({
          type: OpStackItemType.TransferTo,
          to: tokenTrans.to,
        });
      } else if (tokenTrans.to === address) {
        addIfNotExist({
          type: OpStackItemType.TransferFrom,
          from: tokenTrans.from,
        });
      }
    }
  }

  return opStack.sort((a, b) => a.type - b.type);
}

function isOpStackItemsEqual(a: OpStackItem, b: OpStackItem) {
  switch (a.type) {
    case OpStackItemType.Delegation:
      return a.type === b.type && a.to === b.to;

    case OpStackItemType.Origination:
      return a.type === b.type && a.contract === b.contract;

    case OpStackItemType.Interaction:
      return (
        a.type === b.type && a.with === b.with && a.entrypoint === b.entrypoint
      );

    case OpStackItemType.TransferFrom:
      return a.type === b.type && a.from === b.from;

    case OpStackItemType.TransferTo:
      return a.type === b.type && a.to === b.to;

    case OpStackItemType.Other:
      return a.type === b.type && a.name === b.name;
  }
}
