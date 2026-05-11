import { ChangeEvent } from 'react';

import { dispatch } from 'app/store';
import { setDealsEnabledAction } from 'app/store/deals/actions';
import { useDealsEnabledSelector } from 'app/store/deals/selectors';
import { t } from 'lib/i18n';
import { useConfirm } from 'lib/ui/dialog';

export const useTempleDealsSettings = () => {
  const confirm = useConfirm();

  const isEnabled = useDealsEnabledSelector();

  const handleHide = async () => {
    const confirmed = await confirm({
      title: t('disableDealsModalTitle'),
      description: t('disableDealsModalDescription'),
      confirmButtonText: t('disable'),
      hasCloseButton: false
    });

    if (confirmed) {
      dispatch(setDealsEnabledAction(false));
    }
  };

  const handleShow = async () => {
    dispatch(setDealsEnabledAction(true));
  };

  const setEnabled = (toChecked: boolean, event?: ChangeEvent<HTMLInputElement>) => {
    event?.preventDefault();

    return toChecked ? handleShow() : handleHide();
  };

  return { isEnabled, setEnabled };
};
