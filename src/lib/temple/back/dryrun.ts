import { localForger } from "@taquito/local-forging";
import { TezosToolkit } from "@taquito/taquito";

import { formatOpParamsBeforeSend, michelEncoder } from "lib/temple/helpers";
import { ReadOnlySigner } from "lib/temple/read-only-signer";

export type DryRunParams = {
  opParams: any[];
  networkRpc: string;
  sourcePkh: string;
  sourcePublicKey: string;
};

export async function dryRunOpParams({
  opParams,
  networkRpc,
  sourcePkh,
  sourcePublicKey,
}: DryRunParams) {
  try {
    const tezos = new TezosToolkit(networkRpc);

    let bytesToSign: string | undefined;
    const signer = new ReadOnlySigner(sourcePkh, sourcePublicKey, (digest) => {
      bytesToSign = digest;
    });

    tezos.setSignerProvider(signer);
    tezos.setPackerProvider(michelEncoder);

    try {
      await tezos.contract.batch(opParams.map(formatOpParamsBeforeSend)).send();
    } catch {}

    if (bytesToSign) {
      const rawToSign = await localForger.parse(bytesToSign);
      return { bytesToSign, rawToSign };
    }

    return null;
  } catch {
    return null;
  }
}
