import { t } from 'lib/i18n/react';

export const feeInfoTippyProps = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t('routingFeeTooltip'),
  animation: 'shift-away-subtle'
};

export const priceImpactInfoTippyProps = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t('priceImpactInfo'),
  animation: 'shift-away-subtle'
};
