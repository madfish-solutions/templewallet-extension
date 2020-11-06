import * as React from "react";
import { T, t } from "lib/i18n/react";
import useSafeState from "lib/ui/useSafeState";
import Alert from "app/atoms/Alert";
import OpenInExplorerChip from "app/atoms/OpenInExplorerChip";
import HashChip from "app/templates/HashChip";
import { useLazyChainId } from "lib/thanos/front";
import { TZKT_BASE_URLS } from "lib/tzkt";

type OperationStatusProps = {
  typeTitle: string;
  operation: any;
};

const OperationStatus: React.FC<OperationStatusProps> = ({
  typeTitle,
  operation,
}) => {
  const hash = React.useMemo(() => operation.hash || operation.opHash, [
    operation,
  ]);

  const chainId = useLazyChainId();

  const explorerBaseUrl = React.useMemo(
    () => (chainId && TZKT_BASE_URLS.get(chainId)) ?? null,
    [chainId]
  );

  const descFooter = React.useMemo(
    () => (
      <T
        id="operationHash"
        substitutions={[
          <React.Fragment key="hash">
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
          </React.Fragment>,
        ]}
      >
        {(message) => (
          <div className="mt-2 text-xs flex items-center">{message}</div>
        )}
      </T>
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
    operation
      .confirmation()
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
  }, [operation, setAlert, descFooter, typeTitle]);

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
