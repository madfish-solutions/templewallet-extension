import BigNumber from "bignumber.js";

import { BcdTokenTransfer } from "lib/better-call-dev";

export function tryParseTokenTransfers(
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

export function isPositiveNumber(val: BigNumber.Value) {
  return new BigNumber(val).isGreaterThan(0);
}

export function toTokenId(
  contractAddress: string,
  tokenId: string | number = 0
) {
  return `${contractAddress}_${tokenId}`;
}

export function getBcdTokenTransferId(tokenTrans: BcdTokenTransfer) {
  return `${tokenTrans.hash}_${tokenTrans.nonce}`;
}
