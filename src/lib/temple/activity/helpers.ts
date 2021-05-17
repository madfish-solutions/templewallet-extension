import BigNumber from "bignumber.js";

import { BcdTokenTransfer } from "lib/better-call-dev";

export function tryParseTokenTransfers(
  parameters: any,
  destination: string,
  onTransfer: (
    tokenId: string,
    from: string,
    to: string,
    amount: string
  ) => void
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
        onTransfer(toTokenId(destination), from, to, amount);
      }
    }
  } catch {}

  // FA2
  try {
    const { entrypoint, value } = parameters;
    if (entrypoint === "transfer") {
      for (const { args: x } of value as any) {
        let from: string | undefined;

        if (typeof x[0].string === "string") {
          from = x[0].string;
        }
        for (const { args: y } of x[1]) {
          let to, tokenId, amount: string | undefined;

          if (typeof y[0].string === "string") {
            to = y[0].string;
          }
          if (typeof y[1].args[0].int === "string") {
            tokenId = toTokenId(destination, y[1].args[0].int);
          }
          if (typeof y[1].args[1].int === "string") {
            amount = y[1].args[1].int;
          }

          if (from && to && tokenId && amount) {
            onTransfer(tokenId, from, to, amount);
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
