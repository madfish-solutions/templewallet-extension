import { useEffect } from 'react';

import { useTempleClient } from 'lib/temple/front';
import { dispatchConfirmClose } from 'lib/ui/dialog';

export const useCancelConfirmDialogOnLock = () => {
  const { locked } = useTempleClient();

  useEffect(() => {
    if (locked) {
      dispatchConfirmClose(false);
    }
  }, [locked]);
};
