import { t } from 'lib/i18n';
import { SWAP_CASHBACK_PERCENT } from 'lib/route3/constants';

export const feeInfoTippyProps = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t('routingFeeTooltip'),
  animation: 'shift-away-subtle'
};

export const cashbackInfoTippyProps = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t('swapCashbackDescription', [SWAP_CASHBACK_PERCENT]) as string,
  animation: 'shift-away-subtle'
};
