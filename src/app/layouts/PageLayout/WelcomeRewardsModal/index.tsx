import { FC } from 'react';

import { IconBase } from 'app/atoms/IconBase';
import { ActionsButtonsBox, CloseButton } from 'app/atoms/PageModal';
import { MiniPageModal } from 'app/atoms/PageModal/mini-page-modal';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as AdsIcon } from 'app/icons/base/ads_fill.svg';
import { ReactComponent as DollarIcon } from 'app/icons/base/dollar_fill.svg';
import { SHOULD_SHOW_WELCOME_REWARDS_MODAL_STORAGE_KEY } from 'lib/constants';
import { T } from 'lib/i18n';
import { useStorage } from 'lib/temple/front';
import { navigate } from 'lib/woozie';

import { WelcomeRewardsSelectors } from './selectors';

export const WelcomeRewardsModal = () => {
  const [opened, setOpened] = useStorage(SHOULD_SHOW_WELCOME_REWARDS_MODAL_STORAGE_KEY, false);

  const close = () => void setOpened(false);

  const handleGoToRewards = () => {
    close();
    navigate('/rewards');
  };

  return (
    <MiniPageModal opened={opened} onRequestClose={close} showHeader={false}>
      <div className="w-full h-full bg-white">
        <div className="flex justify-end px-3 pt-3 pb-1">
          <CloseButton onClick={close} />
        </div>

        <div className="flex flex-col p-4 rounded-t-8 bg-background">
          <div className="flex flex-col items-center text-center mb-4">
            <p className="text-font-regular-bold mb-1">
              <T id="welcomeToRewards" />
            </p>

            <p className="text-font-description text-grey-1">
              <T id="welcomeToRewardsDescription" />
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <RewardFeatureCard Icon={DollarIcon}>
              <T id="welcomeRewardsCashback" />
            </RewardFeatureCard>

            <RewardFeatureCard Icon={AdsIcon}>
              <T id="welcomeRewardsPromo" />
            </RewardFeatureCard>
          </div>
        </div>
      </div>

      <ActionsButtonsBox flexDirection="row" shouldChangeBottomShift={false}>
        <StyledButton
          size="L"
          className="w-full"
          color="primary"
          onClick={handleGoToRewards}
          testID={WelcomeRewardsSelectors.goToRewards}
        >
          <T id="goToRewards" />
        </StyledButton>
      </ActionsButtonsBox>
    </MiniPageModal>
  );
};

interface RewardFeatureCardProps extends PropsWithChildren {
  Icon: ImportedSVGComponent;
}

const RewardFeatureCard: FC<RewardFeatureCardProps> = ({ Icon, children }) => (
  <div className="flex flex-col justify-center rounded-8 bg-grey-4 p-3">
    <IconBase Icon={Icon} className="text-primary" />

    <p className="text-font-description p-1">{children}</p>
  </div>
);
