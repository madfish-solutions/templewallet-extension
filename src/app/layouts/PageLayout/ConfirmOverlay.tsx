import * as React from "react";
import classNames from "clsx";
import CSSTransition from "react-transition-group/CSSTransition";
import { useThanosClient } from "lib/thanos/front";
import useScrollLock from "lib/ui/useScrollLock";
import Portal from "lib/ui/Portal";
import ContentContainer from "app/layouts/ContentContainer";
import ConfirmOperation from "app/templates/ConfirmOperation";

const ConfirmOverlay: React.FC = () => {
  const { confirmId, setConfirmId, confirmOperation } = useThanosClient();
  const displayed = Boolean(confirmId);

  useScrollLock(displayed);

  const handleConfirm = React.useCallback(
    async (password) => {
      if (confirmId) {
        await confirmOperation(confirmId, true, password);
      }
      setConfirmId(null);
    },
    [confirmId, confirmOperation, setConfirmId]
  );

  const handleDecline = React.useCallback(async () => {
    if (confirmId) {
      await confirmOperation(confirmId, false);
    }
    setConfirmId(null);
  }, [confirmId, confirmOperation, setConfirmId]);

  return (
    <Portal>
      <CSSTransition
        in={displayed}
        timeout={200}
        classNames={{
          enter: "opacity-0",
          enterActive: classNames(
            "opacity-100",
            "transition ease-out duration-200"
          ),
          exit: classNames("opacity-0", "transition ease-in duration-200"),
        }}
        unmountOnExit
      >
        <div className="fixed z-50 inset-0 overflow-y-auto bg-white">
          <ContentContainer
            padding={false}
            className={classNames(
              "h-full",
              "flex flex-col items-center justify-center"
            )}
          >
            <ConfirmOperation
              onConfirm={handleConfirm}
              onDecline={handleDecline}
            />
          </ContentContainer>
        </div>
      </CSSTransition>
    </Portal>
  );
};

export default ConfirmOverlay;
