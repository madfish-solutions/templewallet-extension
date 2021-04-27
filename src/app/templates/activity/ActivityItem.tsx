import React, { memo, useEffect, useMemo, useState } from "react";

import { OpKind } from "@taquito/rpc";
import BigNumber from "bignumber.js";
import classNames from "clsx";
import formatDistanceToNow from "date-fns/formatDistanceToNow";

import OpenInExplorerChip from "app/atoms/OpenInExplorerChip";
import HashChip from "app/templates/HashChip";
import { getDateFnsLocale } from "lib/i18n/react";
import { useExplorerBaseUrls } from "lib/temple/front";
import * as Repo from "lib/temple/repo";

import MoneyDiffView from "./MoneyDiffView";

type ActivityItemProps = {
  address: string;
  operation: Repo.IOperation;
  className?: string;
};

const ActivityItem = memo<ActivityItemProps>(
  ({ address, operation, className }) => {
    const { transaction: explorerBaseUrl } = useExplorerBaseUrls();
    const { hash, addedAt } = operation;

    const moneyDiffs = useMemo(() => parseMoneyDiffs(operation, address), [
      operation,
      address,
    ]);

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
          <div className="flex flex-col pt-1">
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

          <div className="flex flex-col">
            {moneyDiffs.map(({ assetId, diff }, i) => (
              <MoneyDiffView key={i} assetId={assetId} diff={diff} />
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
