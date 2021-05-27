import React, {
  FC,
  memo,
  ReactElement,
  useEffect,
  useMemo,
  useState,
} from "react";

import BigNumber from "bignumber.js";
import classNames from "clsx";
import formatDistanceToNow from "date-fns/formatDistanceToNow";

import Identicon from "app/atoms/Identicon";
import Money from "app/atoms/Money";
import OpenInExplorerChip from "app/atoms/OpenInExplorerChip";
import { ReactComponent as ClipboardIcon } from "app/icons/clipboard.svg";
import HashChip from "app/templates/HashChip";
import InUSD from "app/templates/InUSD";
import { getDateFnsLocale, T, TProps } from "lib/i18n/react";
import {
  TempleAsset,
  TempleAssetType,
  TempleTEZAsset,
  useAssets,
  TEZ_ASSET,
} from "lib/temple/front";

export interface InternalTransfer {
  volume: BigNumber;
  tokenId?: number;
  sender: string;
  receiver: string;
  tokenAddress?: string;
}

export interface OperationPreview {
  counter?: number;
  entrypoint?: string;
  rawReceiver?: string;
  delegate?: string;
  hash: string;
  type: string;
  status: string;
  time: string;
  internalTransfers: InternalTransfer[];
  volume: number;
}

type OperationProps = OperationPreview & {
  accountPkh: string;
  withExplorer: boolean;
  explorerBaseUrl: string | null;
};

type InternalTransferStats = {
  token?: TempleAsset;
  tokenAddress?: string;
  delta: BigNumber;
};

const Operation = memo<OperationProps>(
  ({
    accountPkh,
    delegate,
    entrypoint,
    withExplorer,
    explorerBaseUrl,
    hash,
    rawReceiver,
    type,
    status,
    time,
    internalTransfers,
    volume,
  }) => {
    const { allAssetsWithHidden } = useAssets();
    const imReceiver = internalTransfers.some(
      ({ receiver }) => receiver === accountPkh
    );
    const pending = withExplorer && status === "pending";
    const failed = ["failed", "backtracked", "skipped"].includes(status);
    const volumeExists = volume > 0;
    const volumeAsBigNumber = useMemo(() => new BigNumber(volume), [volume]);
    const hasTokenTransfers = internalTransfers.some(
      ({ tokenAddress }) => !!tokenAddress
    );
    const sender = internalTransfers[0]?.sender;
    const hasReceival = internalTransfers.some(
      ({ receiver }) => receiver === accountPkh
    );
    const hasSending = internalTransfers.some(
      ({ sender }) => sender === accountPkh
    );
    const isTransfer =
      (hasTokenTransfers || (volumeExists && type === "transaction")) &&
      (!entrypoint || entrypoint === "transfer") &&
      !(internalTransfers.length > 1 && hasSending && hasReceival);
    const isSendingTransfer = isTransfer && !imReceiver;
    const isReceivingTransfer = isTransfer && imReceiver;
    const moreExactType = useMemo(() => {
      const rawReceiverIsContract =
        !!rawReceiver && rawReceiver.startsWith("KT");
      const isMultipleTransfersInteraction =
        internalTransfers.length > 1 &&
        internalTransfers.some(({ sender }) => sender.startsWith("KT")) &&
        internalTransfers.some(({ receiver }) => receiver.startsWith("KT"));
      switch (true) {
        case isTransfer:
          return "transfer";
        case type === "delegation":
          return delegate ? "delegation" : "undelegation";
        case type === "transaction" &&
          (rawReceiverIsContract || isMultipleTransfersInteraction):
          return "interaction";
        default:
          return type;
      }
    }, [isTransfer, rawReceiver, type, delegate, internalTransfers]);

    const internalTransfersStats = useMemo(() => {
      return internalTransfers.reduce<InternalTransferStats[]>(
        (statsPart, transfer) => {
          const { tokenAddress, tokenId } = transfer;
          let token = tokenAddress
            ? (allAssetsWithHidden.find((a) => {
                return (
                  a.type !== TempleAssetType.TEZ &&
                  a.address === tokenAddress &&
                  (a.type !== TempleAssetType.FA2 || a.id === tokenId)
                );
              }) as Exclude<TempleAsset, TempleTEZAsset> | undefined)
            : undefined;
          const finalVolume = transfer.volume.div(10 ** (token?.decimals || 0));
          const type = transfer.receiver === accountPkh ? "receive" : "send";
          const delta =
            type === "send" ? finalVolume.multipliedBy(-1) : finalVolume;
          const sameTokenEntryIndex = statsPart.findIndex(
            ({ token, tokenAddress: candidateTokenAddress }) => {
              if (token?.type === TempleAssetType.TEZ) {
                return !tokenAddress && tokenId === undefined;
              }
              if (token?.type === TempleAssetType.FA2) {
                return token.address === tokenAddress && token.id === tokenId;
              }
              return candidateTokenAddress === tokenAddress;
            }
          );
          if (sameTokenEntryIndex === -1) {
            return [
              ...statsPart,
              {
                token,
                tokenAddress,
                delta,
              },
            ];
          }
          const sameTokenEntry = statsPart[sameTokenEntryIndex];
          const tokenEntryNewDelta = sameTokenEntry.delta.plus(delta);
          if (tokenEntryNewDelta.eq(0)) {
            statsPart.splice(sameTokenEntryIndex, 1);
          } else {
            statsPart[sameTokenEntryIndex] = {
              ...sameTokenEntry,
              delta: tokenEntryNewDelta,
            };
          }
          return statsPart;
        },
        []
      );
    }, [internalTransfers, allAssetsWithHidden, accountPkh]);

    const receivers = useMemo(() => {
      const uniqueReceivers = new Set(
        internalTransfers.map((transfer) => transfer.receiver)
      );
      return [...uniqueReceivers];
    }, [internalTransfers]);

    const { iconHash, iconType } = useMemo<{
      iconHash: string;
      iconType: "bottts" | "jdenticon";
    }>(() => {
      switch (true) {
        case isSendingTransfer:
          return { iconHash: receivers[0], iconType: "bottts" };
        case isReceivingTransfer:
          return { iconHash: sender, iconType: "bottts" };
        case type === "delegation" && !!delegate:
          return { iconHash: delegate!, iconType: "bottts" };
        case moreExactType === "interaction":
          return { iconHash: rawReceiver!, iconType: "jdenticon" };
        default:
          return { iconHash: hash, iconType: "jdenticon" };
      }
    }, [
      delegate,
      hash,
      type,
      moreExactType,
      isReceivingTransfer,
      receivers,
      isSendingTransfer,
      rawReceiver,
      sender,
    ]);

    return (
      <div className={classNames("my-3", "flex items-stretch")}>
        <div className="mr-2">
          <Identicon
            hash={iconHash}
            type={iconType}
            size={50}
            className="shadow-xs"
          />
        </div>

        <div className="flex-1">
          <div className="flex items-center">
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
            <div className="flex flex-col">
              <div className="flex items-center mt-1 text-xs text-blue-600 opacity-75">
                {formatOperationType(moreExactType, imReceiver)}
              </div>
              {isReceivingTransfer && (
                <OperationArgumentDisplay
                  i18nKey="transferFromSmb"
                  arg={[sender]}
                />
              )}
              {isSendingTransfer && (
                <OperationArgumentDisplay
                  i18nKey="transferToSmb"
                  arg={receivers}
                />
              )}
              {moreExactType === "interaction" && (
                <OperationArgumentDisplay
                  i18nKey="interactionWithContract"
                  arg={[rawReceiver!]}
                />
              )}
              {moreExactType === "delegation" && (
                <OperationArgumentDisplay
                  i18nKey="delegationToSmb"
                  arg={[delegate!]}
                />
              )}

              {(() => {
                const timeNode = (
                  <Time
                    children={() => (
                      <span className="text-xs font-light text-gray-500">
                        {formatDistanceToNow(new Date(time), {
                          includeSeconds: true,
                          addSuffix: true,
                          locale: getDateFnsLocale(),
                        })}
                      </span>
                    )}
                  />
                );

                switch (true) {
                  case failed:
                    return (
                      <div className="flex items-center">
                        <T id={status}>
                          {(message) => (
                            <span className="mr-1 text-xs font-light text-red-700">
                              {message}
                            </span>
                          )}
                        </T>

                        {timeNode}
                      </div>
                    );

                  case pending:
                    return (
                      <T id="pending">
                        {(message) => (
                          <span className="text-xs font-light text-yellow-600">
                            {message}
                          </span>
                        )}
                      </T>
                    );

                  default:
                    return timeNode;
                }
              })()}
            </div>

            <div className="flex-1" />

            {!failed && (
              <div className="flex flex-col items-end">
                {internalTransfersStats.map((transferStats, index) => (
                  <OperationVolumeDisplay
                    {...transferStats}
                    key={index}
                    pending={pending}
                    isSendOrReceive
                  />
                ))}
                {internalTransfers.length === 0 &&
                  (volume || undefined) &&
                  (isTransfer || type === "delegation") && (
                    <OperationVolumeDisplay
                      delta={volumeAsBigNumber}
                      pending={pending}
                      isSendOrReceive={false}
                    />
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

export default Operation;

type OperationArgumentDisplayProps = {
  i18nKey: TProps["id"];
  arg: string[];
};

const OperationArgumentDisplay = memo<OperationArgumentDisplayProps>(
  ({ i18nKey, arg }) => (
    <span className="font-light text-gray-500 text-xs">
      <T
        id={i18nKey}
        substitutions={
          <>
            {arg.map((value, index) => (
              <span key={index}>
                <HashChip
                  className="text-blue-600 opacity-75"
                  key={index}
                  hash={value}
                  type="link"
                />
                {index === arg.length - 1 ? null : ", "}
              </span>
            ))}
          </>
        }
      />
    </span>
  )
);

type OperationVolumeDisplayProps = InternalTransferStats & {
  pending: boolean;
  isSendOrReceive: boolean;
};

const OperationVolumeDisplay: FC<OperationVolumeDisplayProps> = (props) => {
  const { token, pending, delta, isSendOrReceive, tokenAddress } = props;
  const asset = tokenAddress ? token : TEZ_ASSET;

  return (
    <div className="inline-flex flex-wrap justify-end items-baseline">
      <div
        className={classNames(
          "text-sm",
          (() => {
            switch (true) {
              case pending:
                return "text-yellow-600";

              case isSendOrReceive:
                return delta.gt(0) ? "text-green-500" : "text-red-700";

              default:
                return "text-gray-800";
            }
          })()
        )}
      >
        {isSendOrReceive && (delta.gt(0) ? "+" : "")}
        {BigNumber.isBigNumber(delta) && delta.isNaN() ? (
          "?"
        ) : (
          <Money>{delta}</Money>
        )}
        &nbsp;
        {tokenAddress ? token?.symbol || "???" : "ꜩ"}
      </div>

      {asset && (
        <InUSD volume={delta.abs()} asset={asset}>
          {(usdVolume) => (
            <div className="text-xs text-gray-500 ml-1">
              <span className="mr-px">$</span>
              {usdVolume}
            </div>
          )}
        </InUSD>
      )}
    </div>
  );
};

type TimeProps = {
  children: () => ReactElement;
};

const Time: FC<TimeProps> = ({ children }) => {
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
        <ClipboardIcon className="mr-1 h-3 w-auto stroke-current inline align-text-top" />
      )}
      {operationTypeText}
    </>
  );
}
