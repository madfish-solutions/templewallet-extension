import React, { memo, useCallback, useLayoutEffect } from 'react';

import CSSTransitionBase from 'react-transition-group/CSSTransition';

import DocBg from 'app/a11y/DocBg';
import InternalConfirmation from 'app/templates/InternalConfirmation';
import { useTempleClient } from 'lib/temple/front';
import Portal from 'lib/ui/Portal';
import { resetPendingConfirmationId } from 'temple/front/pending-confirm';

const ConfirmationOverlay = memo(() => {
  const { confirmation, confirmInternal } = useTempleClient();
  const displayed = Boolean(confirmation);

  const CSSTransition = CSSTransitionBase as unknown as React.ComponentType<any>;

  useLayoutEffect(() => {
    if (displayed) {
      const x = window.scrollX;
      const y = window.scrollY;
      document.body.classList.add('overscroll-y-none');

      return () => {
        window.scrollTo(x, y);
        document.body.classList.remove('overscroll-y-none');
      };
    }
    return undefined;
  }, [displayed]);

  const handleConfirm = useCallback(
    async (confirmed: boolean, modifiedTotalFee?: number, modifiedStorageLimit?: number) => {
      if (confirmation) {
        await confirmInternal(confirmation.id, confirmed, modifiedTotalFee, modifiedStorageLimit);
      }
      resetPendingConfirmationId();
    },
    [confirmation, confirmInternal]
  );

  return (
    <>
      {displayed && <DocBg bgClassName="bg-secondary-low" />}

      <Portal>
        <CSSTransition
          in={displayed}
          timeout={200}
          classNames={{
            enter: 'opacity-0',
            enterActive: 'opacity-100 transition ease-out duration-200',
            exit: 'opacity-0 transition ease-in duration-200'
          }}
          unmountOnExit
        >
          <div className="fixed inset-0 z-overlay-confirm overflow-y-auto bg-primary-white">
            {confirmation && (
              <InternalConfirmation
                payload={confirmation.payload}
                error={confirmation.error}
                onConfirm={handleConfirm}
              />
            )}
          </div>
        </CSSTransition>
      </Portal>
    </>
  );
});

export default ConfirmationOverlay;
