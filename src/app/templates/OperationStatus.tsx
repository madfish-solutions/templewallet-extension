import * as React from "react";
import useSafeState from "lib/ui/useSafeState";
import Alert from "app/atoms/Alert";
import HashChip from "app/templates/HashChip";

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
      <div className="mt-2 text-xs">
        Operation Hash:{" "}
        <HashChip hash={hash} firstCharsCount={10} lastCharsCount={7} small />
      </div>
    ),
    [hash]
  );

  const [alert, setAlert] = useSafeState<{
    type: "success" | "error";
    title: string;
    description: React.ReactNode;
  }>(() => ({
    type: "success",
    title: "Success 🛫",
    description: (
      <>
        {typeTitle} request sent! Confirming...
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
          title: "Success ✅",
          description: (
            <>
              {typeTitle} successfully processed and confirmed!
              {descFooter}
            </>
          ),
        }));
      })
      .catch(() => {
        setAlert({
          type: "error",
          title: "Error",
          description:
            "Timed out operation confirmation. You can either wait more time or try again later.",
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
