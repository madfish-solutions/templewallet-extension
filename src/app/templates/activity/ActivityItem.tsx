import React, { memo, useEffect, useMemo, useState } from "react";

import classNames from "clsx";
import formatDistanceToNow from "date-fns/formatDistanceToNow";

import OpenInExplorerChip from "app/atoms/OpenInExplorerChip";
import { OP_STACK_PREVIEW_SIZE } from "app/defaults";
import { ReactComponent as ChevronRightIcon } from "app/icons/chevron-right.svg";
import { ReactComponent as ChevronUpIcon } from "app/icons/chevron-up.svg";
import { ReactComponent as ClipboardIcon } from "app/icons/clipboard.svg";
import HashChip from "app/templates/HashChip";
import { T, t, getDateFnsLocale, TProps } from "lib/i18n/react";
import {
  OpStackItem,
  OpStackItemType,
  parseMoneyDiffs,
  parseOpStack,
} from "lib/temple/activity";
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

    const status = useMemo(() => {
      if (!syncSupported) return null;

      const explorerStatus =
        operation.data.tzktGroup?.[0]?.status ??
        operation.data.bcdTokenTransfers?.[0]?.status;
      return explorerStatus ?? "pending";
    }, [syncSupported, operation.data]);

    const moneyDiffs = useMemo(
      () =>
        !status || ["pending", "applied"].includes(status)
          ? parseMoneyDiffs(operation, address)
          : [],
      [status, operation, address]
    );

    const opStack = useMemo(
      () => parseOpStack(operation, address),
      [operation, address]
    );

    const statusNode = useMemo(() => {
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
              hash={hash}
              className="mr-2"
            />
          )}

          <div className={classNames("flex-1", "h-px", "bg-gray-200")} />
        </div>

        <div className="flex items-stretch">
          <div className="flex flex-col pt-2">
            <OpStack opStack={opStack} className="mb-2" />

            {statusNode && (
              <div className="mb-px text-xs font-light leading-none">
                {statusNode}
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

type OpStackProps = {
  opStack: OpStackItem[];
  className?: string;
};

const OpStack = memo<OpStackProps>(({ opStack, className }) => {
  const [expanded, setExpanded] = useState(false);

  const base = useMemo(
    () => opStack.filter((_, i) => i < OP_STACK_PREVIEW_SIZE),
    [opStack]
  );
  const rest = useMemo(
    () => opStack.filter((_, i) => i >= OP_STACK_PREVIEW_SIZE),
    [opStack]
  );

  const ExpandIcon = expanded ? ChevronUpIcon : ChevronRightIcon;

  return (
    <div className={classNames("flex flex-col", className)}>
      {base.map((item, i) => (
        <OpStackItemComponent key={i} item={item} />
      ))}

      {expanded && (
        <>
          {rest.map((item, i) => (
            <OpStackItemComponent key={i} item={item} />
          ))}
        </>
      )}

      {rest.length > 0 && (
        <div className={classNames("flex items-center", expanded && "mt-1")}>
          <button
            className={classNames(
              "flex items-center",
              "text-blue-600 opacity-75 hover:underline",
              "leading-none"
            )}
            onClick={() => setExpanded((e) => !e)}
          >
            <ExpandIcon
              className={classNames(
                "mr-1 h-3 w-auto",
                "stroke-2 stroke-current"
              )}
            />
            <T id={expanded ? "less" : "more"} />
          </button>
        </div>
      )}
    </div>
  );
});

type OpStackItemProps = {
  item: OpStackItem;
};

const OpStackItemComponent = memo<OpStackItemProps>(({ item }) => {
  const toRender = (() => {
    switch (item.type) {
      case OpStackItemType.Delegation:
        return {
          base: (
            <>
              <T id="delegation" />
            </>
          ),
          argsI18nKey: "delegationToSmb",
          args: [item.to],
        };

      case OpStackItemType.Origination:
        return {
          base: (
            <>
              <T id="origination" />
            </>
          ),
        };

      case OpStackItemType.Interaction:
        return {
          base: (
            <>
              <ClipboardIcon className="mr-1 h-3 w-auto stroke-current" />
              <T id="interaction" />
            </>
          ),
          argsI18nKey: "interactionWithContract",
          args: [item.with],
        };

      case OpStackItemType.TransferFrom:
        return {
          base: (
            <>
              ↓ <T id="transfer" />
            </>
          ),
          argsI18nKey: "transferFromSmb",
          args: [item.from],
        };

      case OpStackItemType.TransferTo:
        return {
          base: (
            <>
              ↑ <T id="transfer" />
            </>
          ),
          argsI18nKey: "transferToSmb",
          args: [item.to],
        };

      case OpStackItemType.Other:
        return {
          base: item.name
            .split("_")
            .map((w) => `${w.charAt(0).toUpperCase()}${w.substring(1)}`)
            .join(" "),
        };
    }
  })();

  return (
    <div className="flex flex-wrap items-center">
      <div
        className={classNames(
          "flex items-center",
          "text-xs text-blue-600 opacity-75"
        )}
      >
        {toRender.base}
      </div>

      {toRender.argsI18nKey && (
        <StackItemArgs
          i18nKey={toRender.argsI18nKey}
          args={toRender.args}
          className="ml-1"
        />
      )}
    </div>
  );
});

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

type StackItemArgsProps = {
  i18nKey: TProps["id"];
  args: string[];
  className?: string;
};

const StackItemArgs = memo<StackItemArgsProps>(
  ({ i18nKey, args, className }) => (
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
  )
);
