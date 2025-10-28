import React, { memo, useCallback } from 'react';

import { IconBase } from 'app/atoms';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as ChartPieSliceIcon } from 'app/icons/base/chart_pie_slice.svg';
import { ReactComponent as GiftIcon } from 'app/icons/base/gift.svg';
import PageLayout from 'app/layouts/PageLayout';
import { useFirefoxDataConsent } from 'app/pages/Welcome/data-collection-agreement/use-firefox-data-consent.hook';

import { DataCollectionAgreementSelectors } from './selectors';

export const DataCollectionAgreement = memo(() => {
  const [, setConsent] = useFirefoxDataConsent();

  const handleAgree = useCallback(async () => {
    await setConsent({ hasResponded: true, agreed: true });
  }, [setConsent]);

  const handleDecline = useCallback(async () => {
    await setConsent({ hasResponded: true, agreed: false });
  }, [setConsent]);

  return (
    <PageLayout>
      <div className="flex flex-col items-center">
        <h1 className="text-2xl font-bold text-center mb-2">Help us improve Temple Wallet</h1>
        <p className="text-sm text-center text-grey-1 mb-8">
          We'd like to collect limited usage data to help improve your Temple Wallet experience.
        </p>

        <div className="w-full flex flex-col gap-4 mb-8">
          <FeatureCard
            icon={ChartPieSliceIcon}
            title="Usage analytics"
            description="We collect anonymous interactions like clicks, views, and performance metrics. This data is used to understand how users navigate Temple Wallet and identify ways to make it better and more intuitive."
          />

          <FeatureCard
            icon={GiftIcon}
            title="Data for rewards"
            description="Temple Wallet support built-in reward programs like non-intrusive promo content to allow users earn TKEY token. For the automatic distribution of these rewards, we collect general information including your IP address (to identify your region) and your public wallet address."
          />
        </div>

        <p className="text-xs text-center text-grey-1 mb-6">
          Review our{' '}
          <a
            href="https://templewallet.com/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Terms of Usage
          </a>{' '}
          and{' '}
          <a
            href="https://templewallet.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Privacy Policy
          </a>{' '}
          for more information. We'll notify you on our website and socials if we plan to use this data for other
          purposes. Remember, you can manage data collection in the Settings any time.
        </p>

        <div className="w-full flex flex-col gap-3">
          <StyledButton
            className="w-full"
            size="L"
            color="primary"
            testID={DataCollectionAgreementSelectors.agreeButton}
            onClick={handleAgree}
          >
            Agree and Continue
          </StyledButton>
          <StyledButton
            className="w-full"
            size="L"
            color="secondary"
            testID={DataCollectionAgreementSelectors.declineButton}
            onClick={handleDecline}
          >
            No thanks
          </StyledButton>
        </div>
      </div>
    </PageLayout>
  );
});

interface FeatureCardProps {
  icon: ImportedSVGComponent;
  title: string;
  description: string;
}

const FeatureCard = memo<FeatureCardProps>(({ icon, title, description }) => (
  <div className="w-full bg-grey-2 bg-opacity-10 rounded-lg p-4">
    <div className="flex items-start gap-3 mb-2">
      <div className="flex-shrink-0 bg-white bg-opacity-10 rounded-full p-3">
        <IconBase Icon={icon} size={24} className="text-white" />
      </div>
      <h3 className="text-lg font-semibold pt-2">{title}</h3>
    </div>
    <p className="text-sm text-grey-1">{description}</p>
  </div>
));
