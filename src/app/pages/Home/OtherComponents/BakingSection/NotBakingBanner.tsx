import React, { memo } from 'react';

import clsx from 'clsx';

import { Divider } from 'app/atoms';
import { DelegateButton } from 'app/atoms/BakingButtons';
import { useAppEnv } from 'app/env';
import { ReactComponent as DelegateIcon } from 'app/icons/delegate.svg';
import { ReactComponent as DiscordIcon } from 'app/icons/delegationDis.svg';
import { ReactComponent as RedditIcon } from 'app/icons/delegationRed.svg';
import { ReactComponent as TelegramIcon } from 'app/icons/delegationTg.svg';
import { ReactComponent as TwitterIcon } from 'app/icons/delegationTwi.svg';
import { ReactComponent as YoutubeIcon } from 'app/icons/delegationYt.svg';
import { ReactComponent as ClockRepeatIcon } from 'app/icons/history.svg';
import { ReactComponent as StockUpIcon } from 'app/icons/stock-up.svg';
import { ReactComponent as ClockIcon } from 'app/icons/time.svg';
import { useGasToken } from 'lib/assets/hooks';
import { T } from 'lib/i18n';

import { BakingSectionSelectors } from './selectors';

interface Props {
  noPreviousHistory: boolean;
  cannotDelegate: boolean;
}

export const NotBakingBanner = memo<Props>(({ noPreviousHistory, cannotDelegate }) => {
  const { isDcpNetwork } = useGasToken();
  const { fullPage } = useAppEnv();

  if (isDcpNetwork)
    return (
      <>
        <DelegateIcon className="self-center w-8 h-8 stroke-current fill-current text-accent-blue" />

        <p className="mt-1 mb-6 text-sm font-light text-center">
          <T id="dcpDelegatingMotivation" />
        </p>

        <DelegateButton
          to="/delegate"
          disabled={cannotDelegate}
          flashing
          testID={BakingSectionSelectors.delegateAndStakeButton}
        >
          <T id="delegateAndStake" />
        </DelegateButton>
      </>
    );

  return (
    <>
      <h3 className="mb-6 font-semibold text-center" style={TITLE_STYLE}>
        <span className="text-accent-blue">
          <T id="delegationPointsHead1" />
        </span>{' '}
        <T id="delegationPointsHead2" />
      </h3>

      {noPreviousHistory && (
        <ul className="mb-6 p-6 flex flex-col gap-y-4 bg-gray-100 rounded-lg">
          <DelegateMotivationPoint Icon={ClockIcon} textNode={<T id="delegationPoint1" />} fullPage={fullPage} />
          <Divider thinest className="mx-4" />
          <DelegateMotivationPoint Icon={ClockRepeatIcon} textNode={<T id="delegationPoint2" />} fullPage={fullPage} />
          <Divider thinest className="mx-4" />
          <DelegateMotivationPoint Icon={StockUpIcon} textNode={<T id="delegationPoint3" />} fullPage={fullPage} />
        </ul>
      )}

      <DelegateButton
        to="/delegate"
        disabled={cannotDelegate}
        flashing
        testID={BakingSectionSelectors.delegateAndStakeButton}
      >
        <T id="delegateAndStake" />
      </DelegateButton>

      <p className="mt-6 mb-2.5 text-xs leading-5 text-center text-gray-600">
        <T id="delegationComunity" />
      </p>

      <div className="self-center flex gap-4">
        {LINKS.map(({ href, Icon }) => (
          <a key={href} href={href} target="_blank" rel="noopener noreferrer">
            <Icon className="h-8 w-8" />
          </a>
        ))}
      </div>
    </>
  );
});

const TITLE_STYLE: React.CSSProperties = {
  fontSize: 19,
  lineHeight: '1.2em',
  letterSpacing: '0.029px'
};

const LINKS = [
  {
    href: 'https://t.me/MadFishCommunity',
    Icon: TelegramIcon
  },
  {
    href: 'https://www.madfish.solutions/discord',
    Icon: DiscordIcon
  },
  {
    href: 'https://twitter.com/madfishofficial',
    Icon: TwitterIcon
  },
  {
    href: 'https://www.youtube.com/channel/UCUp80EXfJEigks3xU5hiwyA',
    Icon: YoutubeIcon
  },
  {
    href: 'https://www.reddit.com/r/MadFishCommunity',
    Icon: RedditIcon
  }
];

const DelegateMotivationPoint: React.FC<{
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  textNode: React.ReactNode;
  fullPage: boolean;
}> = ({ Icon, textNode, fullPage }) => (
  <li className={clsx('flex items-center gap-x-4', fullPage && 'px-7')}>
    <Icon className="flex-shrink-0 w-6 h-6 stroke-current fill-current text-accent-blue" style={{ strokeWidth: 1.5 }} />

    <p className="flex-1 text-sm text-gray-700">{textNode}</p>
  </li>
);
