import * as React from "react";
import { T, t } from "lib/i18n/react";
import useSafeState from "lib/ui/useSafeState";
import Alert from "app/atoms/Alert";
import HashChip from "app/atoms/HashChip";

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

  const descFooter = React.useMemo(
    () => (
      <T
        id="operationHash"
        substitutions={[
          <HashChip
            hash={hash}
            firstCharsCount={10}
            lastCharsCount={7}
            small
            key="hash"
          />,
        ]}
      >
        {(message) => <div className="mt-2 text-xs">{message}</div>}
      </T>
    ),
    [hash]
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
