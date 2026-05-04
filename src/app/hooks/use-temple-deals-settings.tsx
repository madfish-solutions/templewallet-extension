import { ChangeEvent } from 'react';

import { dispatch } from 'app/store';
import { setMerchantPromotionEnabledAction } from 'app/store/merchant-promotion/actions';
import { useMerchantPromotionEnabledSelector } from 'app/store/merchant-promotion/selectors';
import { t } from 'lib/i18n';
import { useConfirm } from 'lib/ui/dialog';

export const useTempleDealsSettings = () => {
  const confirm = useConfirm();

  const isEnabled = useMerchantPromotionEnabledSelector();

  const handleHide = async () => {
    const confirmed = await confirm({
      title: t('disableDealsModalTitle'),
      description: t('disableDealsModalDescription'),
      confirmButtonText: t('disable'),
      hasCloseButton: false
    });

    if (confirmed) {
      dispatch(setMerchantPromotionEnabledAction(false));
    }
  };

  const handleShow = async () => {
    dispatch(setMerchantPromotionEnabledAction(true));
  };

  const setEnabled = (toChecked: boolean, event?: ChangeEvent<HTMLInputElement>) => {
    event?.preventDefault();

    return toChecked ? handleShow() : handleHide();
  };

  return { isEnabled, setEnabled };
};
