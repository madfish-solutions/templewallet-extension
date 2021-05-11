import React, { memo, useEffect, useMemo, useState } from "react";

import { OpKind } from "@taquito/rpc";
import BigNumber from "bignumber.js";
import classNames from "clsx";
import formatDistanceToNow from "date-fns/formatDistanceToNow";

import OpenInExplorerChip from "app/atoms/OpenInExplorerChip";
import { ReactComponent as ClipboardIcon } from "app/icons/clipboard.svg";
import HashChip from "app/templates/HashChip";
import { T, t, getDateFnsLocale, TProps } from "lib/i18n/react";
import { useExplorerBaseUrls } from "lib/temple/front";
import * as Repo from "lib/temple/repo";

import MoneyDiffView from "./MoneyDiffView";

type ActivityItemProps = {
  address: string;
  operation: Repo.IOperation;
  syncSupported: boolean;
  className?: string;
};

const ActivityItem = memo<ActivityItemProps>(
  ({ address, operation, syncSupported, className }) => {
    const { transaction: explorerBaseUrl } = useExplorerBaseUrls();
    const { hash, addedAt } = operation;

    const pending = useMemo(
      () =>
        syncSupported &&
        !(operation.data.tzktGroup || operation.data.bcdTokenTransfers),
      [
        syncSupported,
        operation.data.tzktGroup,
        operation.data.bcdTokenTransfers,
      ]
    );

    const moneyDiffs = useMemo(() => parseMoneyDiffs(operation, address), [
      operation,
      address,
    ]);

    const status = useMemo(() => {
      if (!syncSupported) return null;

      const explorerStatus =
        operation.data.tzktGroup?.[0]?.status ??
        operation.data.bcdTokenTransfers?.[0]?.status;
      const content = explorerStatus ?? "pending";

      return (
        <span
          className={classNames(
            explorerStatus === "applied"
              ? "text-gray-600"
              : explorerStatus
              ? "text-red-600"
              : "text-yellow-600",
            "capitalize"
          )}
        >
          {t(content) || content}
        </span>
      );
    }, [syncSupported, operation.data]);

    return (
      <div className={classNames("my-3", className)}>
        <div className="w-full flex items-center">
          <HashChip
            hash={hash}
            firstCharsCount={10}
            lastCharsCount={7}
            small
            className="mr-2"
          />

          {explorerBaseUrl && (
            <OpenInExplorerChip
              baseUrl={explorerBaseUrl}
              opHash={hash}
              className="mr-2"
            />
          )}

          <div className={classNames("flex-1", "h-px", "bg-gray-200")} />
        </div>

        <div className="flex items-stretch">
          <div className="flex flex-col pt-2">
            <div className="flex flex-col mb-2">
              {[1, 2, 3].map((_, i) => (
                <div className="flex flex-wrap items-center">
                  <div
                    className={classNames(
                      "flex items-center",
                      "text-xs text-blue-600 opacity-75"
                    )}
                  >
                    {formatOperationType("interaction", true)}
                  </div>

                  <StackItem
                    key={i}
                    i18nKey="transferFromSmb"
                    args={["KT1Wa8yqRBpFCusJWgcQyjhRz7hUQAmFxW7j"]}
                    className="ml-1"
                  />
                </div>
              ))}
            </div>

            {status && (
              <div className="mb-px text-xs font-light leading-none">
                {status}
              </div>
            )}

            <Time
              children={() => (
                <span className="text-xs font-light text-gray-500">
                  {formatDistanceToNow(new Date(addedAt), {
                    includeSeconds: true,
                    addSuffix: true,
                    locale: getDateFnsLocale(),
                  })}
                </span>
              )}
            />
          </div>

          <div className="flex-1" />

          <div className="flex flex-col flex-shrink-0">
            {moneyDiffs.map(({ assetId, diff }, i) => (
              <MoneyDiffView
                key={i}
                assetId={assetId}
                diff={diff}
                pending={pending}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
);

export default ActivityItem;

type TimeProps = {
  children: () => React.ReactElement;
};

const Time: React.FC<TimeProps> = ({ children }) => {
  const [value, setValue] = useState(children);

  useEffect(() => {
    const interval = setInterval(() => {
      setValue(children());
    }, 5_000);

    return () => {
      clearInterval(interval);
    };
  }, [setValue, children]);

  return value;
};

function formatOperationType(type: string, imReciever: boolean) {
  if (type === "transaction" || type === "transfer") {
    type = `${imReciever ? "↓" : "↑"}_${type}`;
  }

  const operationTypeText = type
    .split("_")
    .map((w) => `${w.charAt(0).toUpperCase()}${w.substring(1)}`)
    .join(" ");

  return (
    <>
      {type === "interaction" && (
        <ClipboardIcon className="mr-1 h-3 w-auto stroke-current" />
      )}
      {operationTypeText}
    </>
  );
}

type StackItemProps = {
  i18nKey: TProps["id"];
  args: string[];
  className?: string;
};

const StackItem = memo<StackItemProps>(({ i18nKey, args, className }) => (
  <span className={classNames("font-light text-gray-500 text-xs", className)}>
    <T
      id={i18nKey}
      substitutions={args.map((value, index) => (
        <span key={index}>
          <HashChip
            className="text-blue-600 opacity-75"
            key={index}
            hash={value}
            type="link"
          />
          {index === args.length - 1 ? null : ", "}
        </span>
      ))}
    />
  </span>
));

// interface OpStackItem {
//   type: OpStackItemType;
//   param: string;
// }

// function parseOpStack(operation: Repo.IOperation, address: string): OpStackItem[] {
//   const { localGroup, tzktGroup, bcdTokenTransfers } = operation.data;

//   if (tzktGroup) {
//     return tzktGroup.map((tg) => {
//       if (tg.type === "delegation") {
//         return {
//           type: OpStackItemType.Delegation,
//           param: tg.newDelegate
//         };
//       }

//       if (tg.type === "transaction") {
//         if (tg.parameters) {
//           return {
//             type: OpStackItemType.Interaction,
//             param: tg.target.address
//           }
//         }

//         if (tg.sender.address === address) {
//           return {
//             type: OpStackItemType.TransferTo,
//             param: tg.target.address
//           }
//         }

//         if (tg.target.address === address) {
//           return {
//             type: OpStackItemType.TransferFrom,
//             param: tg.sender.address
//           }
//         }
//       }

//       return null;
//     }).filter(Boolean) as OpStackItem[];
//   }

//   if (localGroup) {
//     return localGroup.map((localOp) => {
//       return null;
//     }).filter(Boolean) as OpStackItem[];
//   }

//   return [];
// }

interface MoneyDiff {
  assetId: string;
  diff: string;
}

function parseMoneyDiffs(operation: Repo.IOperation, address: string) {
  const diffs: Record<string, string[]> = {};
  const appendToDiff = (assetId: string, diff: string) => {
    if (!(assetId in diffs)) {
      diffs[assetId] = [];
    }
    if (!diffs[assetId].includes(diff)) {
      diffs[assetId].push(diff);
    }
  };

  const { localGroup, tzktGroup, bcdTokenTransfers } = operation.data;

  if (localGroup) {
    for (const op of localGroup) {
      if (op.kind === OpKind.ORIGINATION) {
        if (op.source === address && isPositiveNumber(op.balance)) {
          appendToDiff("tez", new BigNumber(op.balance).times(-1).toFixed());
        }
      } else if (op.kind === OpKind.TRANSACTION) {
        if (
          (op.source === address || op.destination === address) &&
          isPositiveNumber(op.amount)
        ) {
          appendToDiff(
            "tez",
            new BigNumber(op.amount)
              .times(op.source === address ? -1 : 1)
              .toFixed()
          );
        }

        if (op.parameters) {
          tryParseTokenTransfers(op.parameters, op.destination, {
            onTransfer: (assetId, from, to, amount) => {
              if (from === address || to === address) {
                appendToDiff(
                  assetId,
                  new BigNumber(amount)
                    .times(from === address ? -1 : 1)
                    .toFixed()
                );
              }
            },
          });
        }
      }
    }
  }

  if (tzktGroup) {
    for (const tzktOp of tzktGroup) {
      if (tzktOp.type === "transaction" && tzktOp.status === "applied") {
        if (
          (tzktOp.sender.address === address ||
            tzktOp.target.address === address) &&
          isPositiveNumber(tzktOp.amount)
        ) {
          appendToDiff(
            "tez",
            new BigNumber(tzktOp.amount)
              .times(tzktOp.sender.address === address ? -1 : 1)
              .toFixed()
          );
        }

        if (tzktOp.parameters) {
          try {
            tryParseTokenTransfers(
              JSON.parse(tzktOp.parameters),
              tzktOp.target.address,
              {
                onTransfer: (assetId, from, to, amount) => {
                  if (from === address || to === address) {
                    appendToDiff(
                      assetId,
                      new BigNumber(amount)
                        .times(from === address ? -1 : 1)
                        .toFixed()
                    );
                  }
                },
              }
            );
          } catch {}
        }
      }
    }
  }

  if (bcdTokenTransfers) {
    for (const tokenTrans of bcdTokenTransfers) {
      if (
        tokenTrans.status === "applied" &&
        (tokenTrans.from === address || tokenTrans.to === address)
      ) {
        appendToDiff(
          toTokenId(tokenTrans.contract, tokenTrans.token_id),
          new BigNumber(tokenTrans.amount)
            .times(tokenTrans.from === address ? -1 : 1)
            .toFixed()
        );
      }
    }
  }

  const flatted: Record<string, string> = {};
  for (const assetId of Object.keys(diffs)) {
    flatted[assetId] = diffs[assetId]
      .reduce((sum, val) => sum.plus(val), new BigNumber(0))
      .toFixed();
  }

  const { tez, ...rest } = flatted;
  const result: MoneyDiff[] = [];

  if (tez) {
    result.push({
      assetId: "tez",
      diff: tez,
    });
  }

  result.push(
    ...Object.keys(rest).map((assetId) => ({ assetId, diff: rest[assetId] }))
  );

  return result;
}

function tryParseTokenTransfers(
  parameters: any,
  destination: string,
  opts: {
    onTransfer: (
      tokenId: string,
      from: string,
      to: string,
      amount: string
    ) => void;
  }
) {
  // FA1.2
  try {
    const { entrypoint, value } = parameters;
    if (entrypoint === "transfer") {
      let from, to, amount: string | undefined;

      const { args: x } = value as any;
      if (typeof x[0].string === "string") {
        from = x[0].string;
      }
      const { args: y } = x[1];
      if (typeof y[0].string === "string") {
        to = y[0].string;
      }
      if (typeof y[1].int === "string") {
        amount = y[1].int;
      }

      if (from && to && amount) {
        opts.onTransfer(toTokenId(destination), from, to, amount);
      }
    }
  } catch {}

  // FA2
  try {
    const { entrypoint, value } = parameters;
    if (entrypoint === "transfer") {
      for (const { args: x } of value as any) {
        let tokenId, from, to, amount: string | undefined;

        if (typeof x[0].string === "string") {
          from = x[0].string;
        }
        for (const { args: y } of x[1]) {
          if (typeof y[0].string === "string") {
            to = y[0].string;
          }
          if (typeof y[1].args[0].int === "string") {
            tokenId = toTokenId(destination, y[1].args[0].int);
          }
          if (typeof y[1].args[1].int === "string") {
            amount = y[1].args[1].int;
          }

          if (tokenId && from && to && amount) {
            opts.onTransfer(tokenId, from, to, amount);
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
