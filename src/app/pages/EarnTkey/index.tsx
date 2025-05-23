import React, { memo, useCallback } from 'react';

import { IconBase } from 'app/atoms';
import { ActionsButtonsBox } from 'app/atoms/PageModal';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as AdjustmentIcon } from 'app/icons/base/adjustment.svg';
import { ReactComponent as AdsIcon } from 'app/icons/base/ads_fill.svg';
import { ReactComponent as ChartIcon } from 'app/icons/base/chart_fill.svg';
import { ReactComponent as ScheduleIcon } from 'app/icons/base/schedule.svg';
import PageLayout from 'app/layouts/PageLayout';
import { dispatch } from 'app/store';
import { togglePartnersPromotionAction } from 'app/store/partners-promotion/actions';
import { useShouldShowPartnersPromoSelector } from 'app/store/partners-promotion/selectors';
import { toastSuccess } from 'app/toaster';
import { T, t, TID } from 'lib/i18n';

import { EarnTkeySelectors } from './selectors';

interface Advantage {
  Icon: ImportedSVGComponent;
  textI18nKey: TID;
}

const advantages: Advantage[] = [
  { Icon: AdsIcon, textI18nKey: 'nonIntrusiveAds' },
  { Icon: ChartIcon, textI18nKey: 'earnOnBackground' },
  { Icon: ScheduleIcon, textI18nKey: 'autoPayouts' },
  { Icon: AdjustmentIcon, textI18nKey: 'turnOnWhenNeeded' }
];

export const EarnTkeyPage = memo(() => {
  const isEnabled = useShouldShowPartnersPromoSelector();

  const handleStartEarningClick = useCallback(() => {
    dispatch(togglePartnersPromotionAction(true));
    toastSuccess(t('rewardsEarningEnabled'));
  }, []);

  return (
    <PageLayout pageTitle={t('earn')} contentPadding={false}>
      <div className="flex-1 px-4 flex flex-col overflow-y-auto">
        <h3 className="text-font-h3 text-center pb-4">
          <T id="earnTkeyHeadline" />
        </h3>

        <div className="grid grid-cols-2 gap-3 pb-5">
          {advantages.map(a => (
            <AdvantageComponent key={a.textI18nKey} {...a} />
          ))}
        </div>

        <p className="text-font-small text-grey-1 text-center pb-8">
          <T id="earnTkeyDisclaimer" />
        </p>
      </div>

      <ActionsButtonsBox bgSet={false}>
        <StyledButton
          size="L"
          color="primary"
          disabled={isEnabled}
          onClick={handleStartEarningClick}
          testID={EarnTkeySelectors.startEarningButton}
        >
          <T id={isEnabled ? 'enabled' : 'startEarning'} />
        </StyledButton>
      </ActionsButtonsBox>
    </PageLayout>
  );
});

const AdvantageComponent = memo<Advantage>(({ Icon, textI18nKey }) => (
  <div className="flex flex-col p-3 bg-grey-4 rounded-8">
    <IconBase Icon={Icon} className="text-primary" />
    <p className="text-font-description p-1">
      <T id={textI18nKey} />
    </p>
  </div>
));
