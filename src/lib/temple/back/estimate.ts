import { TezosToolkit } from "@taquito/taquito";
import { ReadOnlySigner } from "lib/temple/read-only-signer";

export type EstimateParams = {
  opParams: any[];
  networkRpc: string;
  sourcePkh: string;
  sourcePublicKey: string;
  overrideFee?: boolean;
};

export async function applyEstimateToOpParams({
  opParams,
  networkRpc,
  sourcePkh,
  sourcePublicKey,
  overrideFee = false,
}: EstimateParams) {
  try {
    const tezos = new TezosToolkit(networkRpc);
    tezos.setSignerProvider(new ReadOnlySigner(sourcePkh, sourcePublicKey));
    const estimates = await tezos.estimate.batch(opParams);
    return opParams.map((op, i) => {
      const est = estimates[i];
      return {
        ...op,
        source: sourcePkh,
        fee: overrideFee && op.fee ? op.fee : est.suggestedFeeMutez,
        gas_limit: est.gasLimit,
        storage_limit: est.storageLimit,
      };
    });
  } catch {
    return opParams;
  }
}
