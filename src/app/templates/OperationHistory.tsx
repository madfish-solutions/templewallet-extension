import * as React from "react";
import classNames from "clsx";
import { useRetryableSWR } from "lib/swr";
import { TZSTATS_CHAINS, TZStatsNetwork } from "lib/tzstats";
import { loadChainId } from "lib/temple/helpers";
import { T } from "lib/i18n/react";
import {
  TempleAssetType,
  TempleAsset,
  TEZ_ASSET,
  useTempleClient,
  useNetwork,
  useOnStorageChanged,
  mutezToTz,
  isKnownChainId,
  TempleToken,
  useChainId,
} from "lib/temple/front";
import { TZKT_BASE_URLS } from "lib/tzkt";
import { BCD_NETWORKS_NAMES } from "app/defaults";
import { ReactComponent as LayersIcon } from "app/icons/layers.svg";
import Operation, {
  OperationPreview,
  InternalTransfer,
} from "app/templates/Operation";
import { tryGetTransfers } from "app/templates/OperationHistory/useOpsPagination";
import useAllOperations from "app/templates/OperationHistory/useAllOperations";
import useTokensOperations from "app/templates/OperationHistory/useTokensOperations";
import FormSecondaryButton from "app/atoms/FormSecondaryButton";
import Spinner from "app/atoms/Spinner";

const PNDOP_EXPIRE_DELAY = 1000 * 60 * 60 * 24;

interface OperationHistoryProps {
  accountPkh: string;
  accountOwner?: string;
  asset?: TempleAsset;
  className?: string;
}

const OperationHistory: React.FC<OperationHistoryProps> = ({
  accountPkh,
  accountOwner,
  asset,
  className,
}) => {
  const chainId = useChainId();
  const tzStatsNetwork = React.useMemo(
    () =>
      (chainId && isKnownChainId(chainId)
        ? TZSTATS_CHAINS.get(chainId)
        : undefined) ?? null,
    [chainId]
  );

  const networkId = React.useMemo(
    () =>
      (chainId && isKnownChainId(chainId)
        ? BCD_NETWORKS_NAMES.get(chainId)
        : undefined) ?? null,
    [chainId]
  );

  return (
    <div
      className={classNames(
        "w-full max-w-md mx-auto",
        "flex flex-col",
        className
      )}
    >
      {!asset || asset.type === TempleAssetType.TEZ ? (
        <AllOperationsList
          accountPkh={accountPkh}
          accountOwner={accountOwner}
          tzStatsNetwork={tzStatsNetwork}
          networkId={networkId}
          tezOnly={!!asset}
        />
      ) : (
        <TokenOperationsList
          accountPkh={accountPkh}
          accountOwner={accountOwner}
          asset={asset}
          tzStatsNetwork={tzStatsNetwork}
          networkId={networkId}
        />
      )}
    </div>
  );
};

export default OperationHistory;

type BaseOperationsListProps = {
  accountPkh: string;
  accountOwner?: string;
  tzStatsNetwork: TZStatsNetwork | null;
  networkId: "mainnet" | "edo2net" | "delphinet" | null;
};

type AllOperationsListProps = BaseOperationsListProps & {
  tezOnly?: boolean;
};

const AllOperationsList: React.FC<AllOperationsListProps> = (props) => {
  const { accountPkh, accountOwner, tzStatsNetwork, tezOnly } = props;
  const { ops, opsEnded, loadMore, loading } = useAllOperations(props);

  return (
    <GenericOperationsList
      operations={ops}
      opsEnded={opsEnded}
      loadMore={loadMore}
      loading={loading}
      accountPkh={accountPkh}
      accountOwner={accountOwner}
      asset={tezOnly ? TEZ_ASSET : undefined}
      withExplorer={!!tzStatsNetwork}
    />
  );
};

type TokenOperationsListProps = BaseOperationsListProps & {
  asset: TempleToken;
};

const TokenOperationsList: React.FC<TokenOperationsListProps> = (props) => {
  const { accountPkh, accountOwner, asset, tzStatsNetwork } = props;
  const { ops, opsEnded, loadMore, loading } = useTokensOperations(props);

  return (
    <GenericOperationsList
      operations={ops}
      opsEnded={opsEnded}
      loadMore={loadMore}
      loading={loading}
      accountPkh={accountPkh}
      accountOwner={accountOwner}
      asset={asset}
      withExplorer={!!tzStatsNetwork}
    />
  );
};

type GenericOperationsListProps = {
  accountPkh: string;
  accountOwner?: string;
  asset?: TempleAsset;
  opsEnded: boolean;
  loading: boolean;
  loadMore: () => void;
  withExplorer: boolean;
  operations: OperationPreview[];
};

const GenericOperationsList: React.FC<GenericOperationsListProps> = ({
  accountPkh,
  operations,
  accountOwner,
  withExplorer,
  asset,
  opsEnded,
  loading,
  loadMore,
}) => {
  const { getAllPndOps, removePndOps } = useTempleClient();
  const network = useNetwork();

  const fetchPendingOperations = React.useCallback(async () => {
    const chainId = await loadChainId(network.rpcBaseURL);
    const sendPndOps = await getAllPndOps(accountPkh, chainId);
    const receivePndOps = accountOwner
      ? (await getAllPndOps(accountOwner, chainId)).filter(
          (op) => op.kind === "transaction" && op.destination === accountPkh
        )
      : [];
    return { pndOps: [...sendPndOps, ...receivePndOps], chainId };
  }, [getAllPndOps, network.rpcBaseURL, accountPkh, accountOwner]);

  const pndOpsSWR = useRetryableSWR(
    ["pndops", network.rpcBaseURL, accountPkh, accountOwner],
    fetchPendingOperations,
    { suspense: true, revalidateOnFocus: false, revalidateOnReconnect: false }
  );
  useOnStorageChanged(pndOpsSWR.revalidate);
  const { pndOps, chainId } = pndOpsSWR.data!;

  const pendingOperations = React.useMemo<OperationPreview[]>(
    () =>
      pndOps
        .map((op, index) => {
          const parameters = (op as any).parameters;
          let internalTransfers: InternalTransfer[] = [];
          let tokenAddress: string | undefined = undefined;
          if (op.kind === "transaction") {
            if (parameters?.entrypoint === "transfer") {
              internalTransfers = tryGetTransfers(parameters) || [];
              if (internalTransfers.length > 0) {
                tokenAddress = op.destination;
              }
            } else if (Number(op.amount || 0)) {
              internalTransfers = [
                {
                  volume: mutezToTz(op.amount),
                  receiver: op.destination,
                  sender: accountPkh,
                },
              ];
            }
          }

          return {
            ...op,
            // @ts-ignore
            counter: Number(op.counter || index),
            entrypoint: parameters?.entrypoint,
            hash: op.hash,
            type: op.kind,
            status: "pending",
            time: op.addedAt,
            internalTransfers: internalTransfers.map((transfer) => ({
              ...transfer,
              tokenAddress,
            })),
            rawReceiver: op.kind === "transaction" ? op.destination : undefined,
            volume:
              op.kind === "transaction" ? mutezToTz(op.amount).toNumber() : 0,
          };
        })
        .filter((op) => {
          if (!asset) return true;

          return asset.type === TempleAssetType.TEZ
            ? op.volume > 0
            : op.internalTransfers[0]?.tokenAddress === asset.address;
        }),
    [pndOps, accountPkh, asset]
  );

  const [uniqueOps, nonUniqueOps] = React.useMemo(() => {
    const unique: OperationPreview[] = [];
    const nonUnique: OperationPreview[] = [];

    for (const pndOp of pendingOperations) {
      const expired =
        new Date(pndOp.time).getTime() + PNDOP_EXPIRE_DELAY < Date.now();

      if (expired || operations.some((op) => opKey(op) === opKey(pndOp))) {
        nonUnique.push(pndOp);
      } else if (unique.every((u) => opKey(u) !== opKey(pndOp))) {
        unique.push(pndOp);
      }
    }

    for (const op of operations) {
      if (unique.every((u) => internalOpKey(u) !== internalOpKey(op))) {
        unique.push(op);
      }
    }

    return [
      unique.sort(
        (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
      ),
      nonUnique,
    ];
  }, [operations, pendingOperations]);

  React.useEffect(() => {
    if (nonUniqueOps.length > 0) {
      removePndOps(
        accountPkh,
        chainId,
        nonUniqueOps.map((o) => o.hash)
      );
    }
  }, [removePndOps, accountPkh, chainId, nonUniqueOps]);

  const explorerBaseUrl = React.useMemo(
    () =>
      (isKnownChainId(chainId) ? TZKT_BASE_URLS.get(chainId) : undefined) ??
      null,
    [chainId]
  );

  return (
    <>
      {uniqueOps.length === 0 && !loading && (
        <div
          className={classNames(
            "mt-4 mb-12",
            "flex flex-col items-center justify-center",
            "text-gray-500"
          )}
        >
          <LayersIcon className="w-16 h-auto mb-2 stroke-current" />

          <h3
            className="text-sm font-light text-center"
            style={{ maxWidth: "20rem" }}
          >
            <T id="noOperationsFound" />
          </h3>
        </div>
      )}

      {uniqueOps.map((op) => (
        <Operation
          key={internalOpKey(op)}
          accountPkh={accountPkh}
          withExplorer={withExplorer}
          explorerBaseUrl={explorerBaseUrl}
          {...op}
        />
      ))}

      {loading && (
        <div
          className="w-full flex items-center justify-center mt-5 mb-3"
          style={{ height: "2.5rem" }}
        >
          <Spinner theme="gray" className="w-16" />
        </div>
      )}

      {!loading && !opsEnded && (
        <div className="w-full flex justify-center mt-5 mb-3">
          <FormSecondaryButton
            disabled={opsEnded || loading}
            loading={loading}
            onClick={loadMore}
            small
          >
            <T id="loadMore" />
          </FormSecondaryButton>
        </div>
      )}
    </>
  );
};

function opKey(op: OperationPreview) {
  return `${op.hash}_${op.type}`;
}

function internalOpKey(op: OperationPreview) {
  return `${op.hash}_${op.type}_${op.counter}`;
}
