import * as React from "react";
import classNames from "clsx";
import CSSTransition from "react-transition-group/CSSTransition";
import { useThanosClient } from "lib/thanos/front";
import useScrollLock from "lib/ui/useScrollLock";
import Portal from "lib/ui/Portal";
import ContentContainer from "app/layouts/ContentContainer";
import InternalConfiramtion from "app/templates/InternalConfiramtion";

const ConfirmationOverlay: React.FC = () => {
  const {
    confirmation,
    resetConfirmation,
    confirmInternal,
  } = useThanosClient();
  const displayed = Boolean(confirmation);

  useScrollLock(displayed);

  const handleConfirm = React.useCallback(
    async (confirmed: boolean) => {
      if (confirmation) {
        await confirmInternal(confirmation.id, confirmed);
      }
      resetConfirmation();
    },
    [confirmation, confirmInternal, resetConfirmation]
  );

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
            {confirmation && (
              <InternalConfiramtion
                payload={confirmation.payload}
                onConfirm={handleConfirm}
              />
            )}
          </ContentContainer>
        </div>
      </CSSTransition>
    </Portal>
  );
};

export default ConfirmationOverlay;
