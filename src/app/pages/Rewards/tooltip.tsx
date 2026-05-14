import { t } from 'lib/i18n';

export const inviteAccountInfoTippyProps = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t('inviteAccountTooltip'),
  animation: 'shift-away-subtle',
  maxWidth: '14rem',
  placement: 'top-start' as const
};

export const dealsInfoTippyProps = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t('rewardsFromDealsTooltip'),
  animation: 'shift-away-subtle',
  maxWidth: '16rem',
  placement: 'top-end' as const
};

export const promoInfoTippyProps = {
  trigger: 'mouseenter',
  hideOnClick: false,
  content: t('rewardsFromPromoTooltip'),
  animation: 'shift-away-subtle',
  maxWidth: '12rem',
  placement: 'top-end' as const
};
