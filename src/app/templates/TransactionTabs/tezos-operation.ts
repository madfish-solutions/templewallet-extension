import { ForgeParams, localForger } from '@taquito/local-forging';
import { RpcClientInterface } from '@taquito/rpc';
import { TezosOperationError, TezosToolkit, WalletParamsWithKind } from '@taquito/taquito';
import BigNumber from 'bignumber.js';

import { buildFinalTezosOpParams, tzToMutez } from 'lib/temple/helpers';
import { ReadOnlySigner } from 'lib/temple/read-only-signer';
import { SerializedEstimate } from 'lib/temple/types';
import { getBalancesChanges } from 'lib/tezos';
import { provePossession } from 'temple/front/tezos';
import { TezosNetworkEssentials } from 'temple/networks';
import { getTezosRpcClient, michelEncoder } from 'temple/tezos';
import { AssetsAmounts } from 'temple/types';

interface TezosFinalOpParamsArgs {
  basicParams: WalletParamsWithKind[];
  /** `undefined` while the estimate is loading */
  estimates: SerializedEstimate[] | undefined;
  revealFee: BigNumber;
  totalFeeTz: string;
  storageLimit: string;
  totalDefaultStorageLimit: BigNumber;
}

export const getTotalStorageLimit = (estimates: SerializedEstimate[] | undefined) => {
  return (estimates ?? []).reduce((acc, { storageLimit }) => acc.plus(storageLimit), new BigNumber(0));
};

export const getTezosFinalOpParams = ({
  basicParams,
  estimates,
  revealFee,
  totalFeeTz,
  storageLimit,
  totalDefaultStorageLimit
}: TezosFinalOpParamsArgs): WalletParamsWithKind[] => {
  let paramsWithEstimates = null;

  if (estimates) {
    const hasReveal = revealFee.gt(0) && estimates.length > basicParams.length;
    const estimateOffset = hasReveal ? 1 : 0;
    paramsWithEstimates = basicParams.map((param, index) => ({
      ...param,
      gasLimit: param.gasLimit || estimates[index + estimateOffset].gasLimit,
      storageLimit: param.storageLimit || estimates[index + estimateOffset].storageLimit
    }));
  }

  return buildFinalTezosOpParams(
    paramsWithEstimates || basicParams,
    tzToMutez(totalFeeTz).minus(tzToMutez(revealFee)).toNumber(),
    storageLimit ? Number(storageLimit) : totalDefaultStorageLimit.toNumber()
  );
};

export const forgeTezosOperation = async (
  network: TezosNetworkEssentials,
  accountPkh: string,
  sourcePublicKey: string,
  opParams: WalletParamsWithKind[]
) => {
  let bytesToSign: string | undefined;
  const signer = new ReadOnlySigner(
    accountPkh,
    sourcePublicKey,
    digest => {
      bytesToSign = digest;
    },
    () => provePossession(accountPkh)
  );

  const readOnlyTezos = new TezosToolkit(getTezosRpcClient(network));
  readOnlyTezos.setSignerProvider(signer);
  readOnlyTezos.setPackerProvider(michelEncoder);

  const forgeParams = readOnlyTezos.prepare.toForge(await readOnlyTezos.prepare.batch(opParams));

  try {
    await readOnlyTezos.signer.sign(await localForger.forge(forgeParams), new Uint8Array([3]));
  } catch {
    // Do nothing
  }

  return { forgeParams, bytesToSign };
};

export const simulateTezosBalancesChanges = async (
  rpc: RpcClientInterface,
  chainId: string,
  operation: ForgeParams,
  accountPkh: string
): Promise<AssetsAmounts> => {
  let response;
  try {
    response = await rpc.simulateOperation({ operation, chain_id: chainId });
  } catch (e) {
    console.error(e);

    response = await rpc
      .simulateOperation({ operation: { branch: operation.branch, contents: operation.contents }, chain_id: chainId })
      .catch(() => {
        throw e;
      });
  }

  const errors = response.contents.flatMap(entry => {
    if (!('metadata' in entry)) return [];

    const { metadata } = entry;
    const resultErrors = 'operation_result' in metadata ? (metadata.operation_result.errors ?? []) : [];
    const internalErrors =
      'internal_operation_results' in metadata
        ? (metadata.internal_operation_results ?? []).flatMap(operation => operation.result.errors ?? [])
        : [];

    return [...resultErrors, ...internalErrors];
  });
  if (errors.length) {
    throw new TezosOperationError(errors, 'Simulation failed', response.contents);
  }

  if (
    response.contents.some(
      entry =>
        'metadata' in entry &&
        'operation_result' in entry.metadata &&
        entry.metadata.operation_result.status !== 'applied'
    )
  ) {
    throw new Error('Failed get results by simulation.');
  }

  return getBalancesChanges(response.contents, accountPkh);
};
