import React, { memo, useCallback, useLayoutEffect } from 'react';

import DocBg from 'app/a11y/DocBg';
import { FadeTransition } from 'app/a11y/FadeTransition';
import InternalConfirmation from 'app/templates/InternalConfirmation';
import { useTempleClient } from 'lib/temple/front';
import Portal from 'lib/ui/Portal';
import { resetPendingConfirmationId } from 'temple/front/pending-confirm';

const ConfirmationOverlay = memo(() => {
  const { confirmation, confirmInternal } = useTempleClient();
  const displayed = Boolean(confirmation);

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
        <FadeTransition trigger={displayed} duration={200} hideOnExit unmountOnExit>
          <div className="fixed inset-0 z-overlay-confirm overflow-y-auto bg-primary-white">
            {confirmation && (
              <InternalConfirmation
                payload={confirmation.payload}
                error={confirmation.error}
                onConfirm={handleConfirm}
              />
            )}
          </div>
        </FadeTransition>
      </Portal>
    </>
  );
});

export default ConfirmationOverlay;
