import { FC } from 'react';

import { IconBase, PageTitle } from 'app/atoms';
import { ReactComponent as ClockCheckIcon } from 'app/icons/base/clock-check.svg';
import { ReactComponent as InfoIcon } from 'app/icons/base/InfoFill.svg';
import { ReactComponent as ReceiveCheckIcon } from 'app/icons/base/receive-check.svg';
import { ReactComponent as SearchSparkleIcon } from 'app/icons/base/search-sparkle.svg';
import { ReactComponent as VerifiedIcon } from 'app/icons/base/verified.svg';
import PageLayout from 'app/layouts/PageLayout';
import rewardsAnimation from 'app/pages/Home/notification-banner/enable-ads-banner/rewards-animation.json';
import { t } from 'lib/i18n';
import { Lottie } from 'lib/ui/react-lottie';

import dealsIllustration from './assets/deals-illustration.png';

const rewardsAnimationOptions = {
  loop: false,
  autoplay: true,
  animationData: rewardsAnimation,
  rendererSettings: { preserveAspectRatio: 'xMidYMid slice' }
};

export const RewardsDealsHowItWorks: FC = () => (
  <PageLayout pageTitle={<PageTitle title={t('howItWorks')} />} contentPadding={false}>
    <div className="bg-white px-4 flex flex-col">
      <section className="flex flex-col gap-4 items-center pt-4 pb-8">
        <div className="w-20 h-20 mx-auto">
          <Lottie options={rewardsAnimationOptions} />
        </div>
        <div className="flex flex-col gap-1 w-full">
          <h3 className="text-font-h3 text-center">{t('templeDeals')}</h3>
          <p className="text-font-description text-grey-1 text-center">{t('dealsExplanationBody')}</p>
        </div>
        <img src={dealsIllustration} alt="" className="w-full h-38 object-contain" />
        <div className="grid grid-cols-2 gap-3 w-full">
          <ExplainerCard Icon={SearchSparkleIcon} text={t('dealsExplanationCard1')} />
          <ExplainerCard Icon={ReceiveCheckIcon} text={t('dealsExplanationCard2')} />
        </div>
      </section>

      <section className="flex flex-col gap-3 items-center pt-4 pb-6">
        <div className="flex flex-col gap-1 w-80 mb-3">
          <h3 className="text-font-h3 text-center">{t('howRewardsReachYou')}</h3>
          <p className="text-font-description text-grey-1 text-center">{t('howRewardsReachYouBody')}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 w-full">
          <ExplainerCard Icon={VerifiedIcon} text={t('howRewardsReachYouCard1')} />
          <ExplainerCard Icon={ClockCheckIcon} text={t('howRewardsReachYouCard2')} />
        </div>
        <div className="bg-secondary-low rounded-6 p-3 flex gap-1 w-full">
          <IconBase size={24} Icon={InfoIcon} className="text-secondary shrink-0" />
          <div className="flex flex-col gap-0.5">
            <p className="text-font-description-bold">{t('note')}</p>
            <p className="text-font-description">{t('commissionsAndIpNote')}</p>
          </div>
        </div>
      </section>
    </div>
  </PageLayout>
);

interface ExplainerCardProps {
  Icon: ImportedSVGComponent;
  text: string;
}

const ExplainerCard: FC<ExplainerCardProps> = ({ Icon, text }) => (
  <div className="bg-grey-4 rounded-8 p-3 flex flex-col gap-1">
    <IconBase size={24} Icon={Icon} className="text-primary" />
    <p className="text-font-description p-1">{text}</p>
  </div>
);
