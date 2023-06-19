import { t } from 'lib/i18n';

export const feeInfoTippyProps = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t('routingFeeTooltip'),
  animation: 'shift-away-subtle'
};

export const cashbackInfoTippyProps = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t('swapCashbackDescription'),
  animation: 'shift-away-subtle'
};
