import BigNumber from "bignumber.js";
import * as React from "react";
import { mutezToTz } from "../helpers";
import { ThanosAssetType, ThanosToken } from "../types";
import { useAssets } from "./assets";

interface TransferBase {
  type: "transferXTZ" | "transferToken";
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

function tryParseTransfers(operations: any[]): RawTransfer[] {
  return operations
    .map((operation) => {
      if (typeof operation !== "object") {
        return undefined;
      }
      if (!operation.parameter) {
        const rawAmount = operation.amount;
        const to = operation.to || operation.destination;
        if (
          (typeof rawAmount !== "number" && typeof rawAmount !== "string") ||
          typeof to !== "string"
        ) {
          return undefined;
        }
        return {
          type: "transferXTZ",
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

export type TransferXTZ = RawTransferXTZ;
export type TransferToken = Omit<RawTransferToken, "tokenAddress"> & {
  token: ThanosToken | string;
};
export type Transfer = TransferXTZ | TransferToken;

export function useTransfersData(operations: any[]): Transfer[] {
  const { allAssets } = useAssets();
  const transfers = React.useMemo(
    () =>
      tryParseTransfers(operations).map((operation) => {
        if (operation.type === "transferXTZ") {
          return operation;
        }
        const { tokenAddress, amount, ...restProps } = operation;
        const token = allAssets.find(
          (asset) =>
            asset.type !== ThanosAssetType.XTZ && asset.address === tokenAddress
        ) as ThanosToken;

        return {
          token: token || tokenAddress,
          amount: token ? amount.div(10 ** token.decimals) : amount,
          ...restProps,
        };
      }),
    [operations, allAssets]
  );

  return transfers;
}
