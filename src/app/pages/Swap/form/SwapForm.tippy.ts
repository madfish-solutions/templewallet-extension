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

export const protocolFeeInfoTippyProps = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t('protocolFeeTooltip'),
  animation: 'shift-away-subtle',
  maxWidth: '16rem',
  placement: 'top-start' as const
};

export const toolsInfoTippyProps = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t('bridgeToolsTooltip'),
  animation: 'shift-away-subtle',
  maxWidth: '12rem',
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
