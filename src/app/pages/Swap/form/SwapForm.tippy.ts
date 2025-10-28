import { t } from 'lib/i18n';

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
