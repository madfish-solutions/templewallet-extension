import React, { memo, useCallback } from 'react';

import { IconBase } from 'app/atoms';
import { Size } from 'app/atoms/IconBase';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as ChartPieSliceIcon } from 'app/icons/base/chart_pie_slice.svg';
import { ReactComponent as GiftIcon } from 'app/icons/base/gift.svg';
import PageLayout from 'app/layouts/PageLayout';
import { useFirefoxDataConsent } from 'app/pages/Welcome/data-collection-agreement/use-firefox-data-consent.hook';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from 'lib/constants';
import { DISABLE_ADS } from 'lib/env';
import { T, TID } from 'lib/i18n';
import { NullComponent } from 'lib/ui/null-component';

import { DataCollectionAgreementSelectors } from './selectors';

interface Props {
  onConsent: EmptyFn;
}

export const DataCollectionAgreement = memo<Props>(({ onConsent }) => {
  const [, setConsent] = useFirefoxDataConsent();

  const handleAgree = useCallback(async () => {
    await setConsent({ hasResponded: true, agreed: true });
    onConsent();
  }, [onConsent, setConsent]);

  const handleDecline = useCallback(async () => {
    await setConsent({ hasResponded: true, agreed: false });
    onConsent();
  }, [onConsent, setConsent]);

  return (
    <PageLayout Header={NullComponent} contentPadding={false} showTestnetModeIndicator={false}>
      <div className="flex flex-col flex-grow px-4 pt-6">
        <h3 className="text-font-h3 text-center mb-3">
          <T id="helpImproveTemple" />
        </h3>
        <p className="text-font-description text-center mb-6">
          <T id="weWouldLikeToCollectUserData" />
        </p>

        <div className="w-full flex flex-col gap-6 mb-6">
          <FeatureCard
            icon={ChartPieSliceIcon}
            title="usageAnalyticsConsent"
            description="usageAnalyticsConsentDescription"
          />

          <FeatureCard
            icon={GiftIcon}
            iconSize={24}
            title="dataForRewardsConsent"
            description={
              DISABLE_ADS ? 'disabledAdsDataForRewardsConsentDescription' : 'dataForRewardsConsentDescription'
            }
          />
        </div>

        <div className="flex-1" />

        <p className="text-font-description text-center text-grey-1 mb-6">
          <T
            id="reviewTermsOfUsageAndPrivacyPolicy"
            substitutions={[
              <Anchor key="termsLink" href={TERMS_OF_USE_URL} text="termsOfUsage" />,
              <Anchor key="privacyPolicyLink" href={PRIVACY_POLICY_URL} text="privacyPolicy" />
            ]}
          />
        </p>
      </div>

      <ActionsButtonsBox className="sticky left-0 bottom-0">
        <StyledButton
          className="w-full"
          size="L"
          color="primary"
          testID={DataCollectionAgreementSelectors.agreeButton}
          onClick={handleAgree}
        >
          <T id="agreeContinue" />
        </StyledButton>
        <StyledButton
          className="w-full"
          size="L"
          color="primary-low"
          testID={DataCollectionAgreementSelectors.declineButton}
          onClick={handleDecline}
        >
          <T id="noThanks" />
        </StyledButton>
      </ActionsButtonsBox>
    </PageLayout>
  );
});

interface FeatureCardProps {
  icon: ImportedSVGComponent;
  title: TID;
  description: TID;
  iconSize?: Size;
}

const FeatureCard = memo<FeatureCardProps>(({ icon, iconSize, title, description }) => (
  <div className="w-full bg-grey-4 border border-lines rounded-8 p-4">
    <div className="h-11 w-full flex justify-start items-center gap-2 mb-2">
      <div className="w-10 h-10 flex justify-center items-center bg-lines rounded-full mx-0.5">
        <IconBase Icon={icon} size={iconSize} className="text-black" />
      </div>
      <p className="text-font-regular-bold">
        <T id={title} />
      </p>
    </div>
    <p className="text-font-medium">
      <T id={description} />
    </p>
  </div>
));

interface AnchorProps {
  href: string;
  text: TID;
}

const Anchor = memo<AnchorProps>(({ href, text }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="text-font-description-bold underline hover:text-secondary"
  >
    <T id={text} />
  </a>
));
