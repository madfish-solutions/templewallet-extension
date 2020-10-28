import BigNumber from "bignumber.js";
import * as React from "react";
import { mutezToTz } from "lib/thanos/helpers";
import {
  OperationsPreview,
  ThanosAssetType,
  ThanosToken,
  useAssets,
  useAccount,
} from "lib/thanos/front";

interface TransferBase {
  type: "transferXTZ" | "transferToken";
  from?: string;
  to: string;
  amount: BigNumber;
}

interface RawTransferXTZ extends TransferBase {
  type: "transferXTZ";
}

interface RawTransferToken extends TransferBase {
  type: "transferToken";
  tokenAddress: string;
}

type RawTransfer = RawTransferXTZ | RawTransferToken;

function tryParseTransfers(operations: OperationsPreview): RawTransfer[] {
  const operationsAsArray =
    operations instanceof Array ? operations : operations.contents;
  return operationsAsArray
    .map<RawTransfer | undefined>((operation) => {
      if (typeof operation !== "object") {
        return undefined;
      }
      if (!operation.parameter) {
        const rawAmount = operation.amount;
        const to = operation.to || operation.destination;
        const from: string | undefined = operation.source;
        if (
          (typeof rawAmount !== "number" && typeof rawAmount !== "string") ||
          typeof to !== "string"
        ) {
          return undefined;
        }
        return {
          type: "transferXTZ",
          from,
          to,
          amount:
            operation.mutez === false
              ? new BigNumber(rawAmount)
              : mutezToTz(new BigNumber(rawAmount)),
        };
      }

      const tokenAddress = operation.to;
      const entrypoint = operation.parameter?.entrypoint;
      const args = operation.parameter?.value?.args?.[1]?.args;
      const to = args?.[0]?.string;
      const amount = args?.[1]?.int;
      if (
        [tokenAddress, to, amount].some((value) => typeof value !== "string") ||
        entrypoint !== "transfer"
      ) {
        return undefined;
      }
      return {
        type: "transferToken",
        to,
        amount: new BigNumber(amount),
        tokenAddress,
      };
    })
    .filter(
      (parsedOperation): parsedOperation is RawTransfer => !!parsedOperation
    );
}

export type TransferXTZ = RawTransferXTZ & {
  from: string;
};
export type TransferToken = Omit<RawTransferToken, "tokenAddress"> & {
  token: ThanosToken | string;
  from: string;
};
export type Transfer = TransferToken | TransferXTZ;

export function useTransfersData(operations: OperationsPreview): Transfer[] {
  const { allAssets } = useAssets();
  const account = useAccount();
  const transfers = React.useMemo(
    () =>
      tryParseTransfers(operations).map((operation) => {
        if (operation.type === "transferXTZ") {
          const { from, ...restProps } = operation;
          return {
            from: from || account.publicKeyHash,
            ...restProps,
          };
        }
        const { from, tokenAddress, amount, ...restProps } = operation;
        const token = allAssets.find(
          (asset) =>
            asset.type !== ThanosAssetType.XTZ && asset.address === tokenAddress
        ) as ThanosToken;

        return {
          from: from || account.publicKeyHash,
          token: token || tokenAddress,
          amount: token ? amount.div(10 ** token.decimals) : amount,
          ...restProps,
        };
      }),
    [operations, allAssets, account.publicKeyHash]
  );

  return transfers;
}
