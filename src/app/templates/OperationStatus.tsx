import * as React from "react";
import { T, useTranslation } from "lib/ui/i18n";
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
  const { t } = useTranslation();
  const hash = React.useMemo(() => operation.hash || operation.opHash, [
    operation,
  ]);

  const descFooter = React.useMemo(
    () => (
      <T
        name="operationHash"
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
        <T name="requestSent" substitutions={typeTitle}>
          {(message) => <>{message}</>}
        </T>
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
                name="operationSuccessfullyProcessed"
                substitutions={typeTitle}
              >
                {(message) => <>{message}</>}
              </T>
              {descFooter}
            </>
          ),
        }));
      })
      .catch(() => {
        setAlert({
          type: "error",
          title: t("error") as string,
          description: t("timedOutOperationConfirmation"),
        });
      });
  }, [operation, setAlert, descFooter, typeTitle, t]);

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
