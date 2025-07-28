import { t } from 'lib/i18n';
import { SWAP_CASHBACK_RATIO } from 'lib/route3/constants';

export const feeInfoTippyProps = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t('routingFeeTooltip'),
  animation: 'shift-away-subtle',
  maxWidth: '16rem',
  placement: 'top-start' as const
};

export const evmFeeInfoTippyProps = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t('routingFeeTooltipEvm'),
  animation: 'shift-away-subtle',
  maxWidth: '16rem',
  placement: 'top-start' as const
};

export const extraGasInfoTippyProps = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t('extraGasInfoTooltipEvm'),
  animation: 'shift-away-subtle',
  maxWidth: '16rem',
  placement: 'top-start' as const
};

export const cashbackInfoTippyProps = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t('swapCashbackDescription', String(SWAP_CASHBACK_RATIO * 100)),
  animation: 'shift-away-subtle',
  maxWidth: '16rem',
  placement: 'top-start' as const
};
