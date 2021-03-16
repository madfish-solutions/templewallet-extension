import * as React from "react";
import { T, t } from "lib/i18n/react";
import useSafeState from "lib/ui/useSafeState";
import { useTezos, useBlockTriggers } from "lib/temple/front";
import Alert from "app/atoms/Alert";
import OpenInExplorerChip from "app/atoms/OpenInExplorerChip";
import HashChip from "app/templates/HashChip";
import { isKnownChainId, useChainId } from "lib/temple/front";
import { TZKT_BASE_URLS } from "lib/tzkt";

type OperationStatusProps = {
  typeTitle: string;
  operation: any;
};

const OperationStatus: React.FC<OperationStatusProps> = ({
  typeTitle,
  operation,
}) => {
  const tezos = useTezos();
  const { confirmOperationAndTriggerNewBlock } = useBlockTriggers();

  const hash = React.useMemo(() => operation.hash || operation.opHash, [
    operation,
  ]);

  const chainId = useChainId();

  const explorerBaseUrl = React.useMemo(
    () =>
      (chainId &&
        (isKnownChainId(chainId) ? TZKT_BASE_URLS.get(chainId) : undefined)) ??
      null,
    [chainId]
  );

  const descFooter = React.useMemo(
    () => (
      <div className="mt-2 text-xs flex items-center">
        <T id="operationHash" />:{" "}
        <HashChip
          hash={hash}
          firstCharsCount={10}
          lastCharsCount={7}
          small
          key="hash"
          className="ml-2 mr-2"
        />
        {explorerBaseUrl && (
          <OpenInExplorerChip baseUrl={explorerBaseUrl} opHash={hash} />
        )}
      </div>
    ),
    [hash, explorerBaseUrl]
  );

  const [alert, setAlert] = useSafeState<{
    type: "success" | "error";
    title: string;
    description: React.ReactNode;
  }>(() => ({
    type: "success",
    title: `${t("success")} 🛫`,
    description: (
      <>
        <T id="requestSent" substitutions={typeTitle} />
        {descFooter}
        <div className="flex-1" />
      </>
    ),
  }));

  React.useEffect(() => {
    const abortCtrl = new AbortController();

    confirmOperationAndTriggerNewBlock(tezos, hash, {
      signal: abortCtrl.signal,
    })
      .then(() => {
        setAlert((a) => ({
          ...a,
          title: `${t("success")} ✅`,
          description: (
            <>
              <T
                id="operationSuccessfullyProcessed"
                substitutions={typeTitle}
              />
              {descFooter}
            </>
          ),
        }));
      })
      .catch(() => {
        setAlert({
          type: "error",
          title: t("error"),
          description: t("timedOutOperationConfirmation"),
        });
      });

    return () => abortCtrl.abort();
  }, [
    confirmOperationAndTriggerNewBlock,
    tezos,
    hash,
    setAlert,
    descFooter,
    typeTitle,
  ]);

  return (
    <Alert
      type={alert.type}
      title={alert.title}
      description={alert.description}
      autoFocus
      className="mb-8"
    />
  );
};

export default OperationStatus;
