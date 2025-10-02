import { t } from 'lib/i18n';

export const inviteAccountInfoTippyProps = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t('inviteAccountTooltip'),
  animation: 'shift-away-subtle',
  maxWidth: '14rem',
  placement: 'top-start' as const
};

export const advancedFeaturesInfoTippyProps = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t('advancedFeaturesTooltip'),
  animation: 'shift-away-subtle',
  maxWidth: '16rem',
  placement: 'top-end' as const
};
