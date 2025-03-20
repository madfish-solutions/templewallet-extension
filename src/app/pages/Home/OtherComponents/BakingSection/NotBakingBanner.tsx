import React, { memo } from 'react';

import { IconBase } from 'app/atoms';
import { Lottie } from 'app/atoms/react-lottie';
import { StyledButton } from 'app/atoms/StyledButton';
import { ReactComponent as BarChartIcon } from 'app/icons/base/bar-chart.svg';
import { ReactComponent as CalendarIcon } from 'app/icons/base/calendar.svg';
import { ReactComponent as NoLockIcon } from 'app/icons/base/no-lock.svg';
import { ReactComponent as RewardsIcon } from 'app/icons/base/rewards.svg';
import { PageModalScrollViewWithActions } from 'app/templates/page-modal-scroll-view-with-actions';
import { TEZOS_APY } from 'lib/constants';
import { T } from 'lib/i18n';

import { BakingSectionSelectors } from './selectors';
import tezCoinAnimation from './tez-coin-animation.json';

interface Props {
  noPreviousHistory: boolean;
  cannotDelegate: boolean;
}

const tezCoinAnimationOptions = {
  loop: true,
  autoplay: true,
  animationData: tezCoinAnimation,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid slice'
  }
};

export const NotBakingBanner = memo<Props>(({ noPreviousHistory, cannotDelegate }) => (
  <>
    <PageModalScrollViewWithActions
      initialBottomEdgeVisible
      actionsBoxProps={{
        children: (
          <StyledButton
            disabled={cannotDelegate}
            size="L"
            className="w-full"
            color="secondary"
            testID={BakingSectionSelectors.delegateAndStakeButton}
          >
            <T id="delegateAndStake" />
          </StyledButton>
        )
      }}
    >
      <div className="flex justify-center">
        <Lottie isClickToPauseDisabled options={tezCoinAnimationOptions} height={172} width={172} />
      </div>

      <h3 className="mb-4 text-font-h3 text-center">
        <T id="delegationPointsHead" substitutions={String(TEZOS_APY)} />
      </h3>

      {noPreviousHistory && (
        <div className="grid grid-cols-2 gap-3">
          <DelegateMotivationPoint Icon={NoLockIcon} textNode={<T id="noLockDelegationPoint" />} />
          <DelegateMotivationPoint Icon={RewardsIcon} textNode={<T id="rewardsDelegationPoint" />} />
          <DelegateMotivationPoint Icon={CalendarIcon} textNode={<T id="delayDelegationPoint" />} />
          <DelegateMotivationPoint Icon={BarChartIcon} textNode={<T id="stakeDelegationPoint" />} />
        </div>
      )}
    </PageModalScrollViewWithActions>
  </>
));

const DelegateMotivationPoint: React.FC<{
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  textNode: React.ReactNode;
}> = ({ Icon, textNode }) => (
  <div className="flex flex-col p-3 bg-grey-4 rounded-xl">
    <IconBase size={16} className="text-secondary" Icon={Icon} />
    <p className="p-1 text-font-description">{textNode}</p>
  </div>
);
