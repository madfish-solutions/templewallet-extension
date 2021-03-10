import { TezosToolkit } from "@taquito/taquito";
import { localForger } from "@taquito/local-forging";
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

    try {
      await tezos.contract.batch(opParams).send();
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
