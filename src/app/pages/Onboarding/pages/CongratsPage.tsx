import React, { FC } from 'react';

import { Button } from 'app/atoms/Button';
import { ReactComponent as DiscordIcon } from 'app/icons/discord.svg';
import { ReactComponent as RedditIcon } from 'app/icons/reddit.svg';
import { ReactComponent as TelegramIcon } from 'app/icons/telegram.svg';
import { ReactComponent as TwitterIcon } from 'app/icons/twitter.svg';
import { ReactComponent as YoutubeIcon } from 'app/icons/youtube.svg';
import { T } from 'lib/i18n';

import { useOnboardingProgress } from '../hooks/useOnboardingProgress.hook';
import styles from '../Onboarding.module.css';

const links = [
  {
    href: 'https://www.madfish.solutions/discord',
    background: '#7289DA',
    Icon: DiscordIcon
  },
  {
    href: 'https://t.me/MadFishCommunity',
    background: '#26A5E4',
    Icon: TelegramIcon
  },
  {
    href: 'https://twitter.com/madfishofficial',
    background: '#1DA1F2',
    Icon: TwitterIcon
  },
  {
    href: 'https://www.youtube.com/channel/UCUp80EXfJEigks3xU5hiwyA',
    background: '#FF0000',
    Icon: YoutubeIcon
  },
  {
    href: 'https://www.reddit.com/r/MadFishCommunity',
    background: '#FF4500',
    Icon: RedditIcon
  }
];

const CongratsPage: FC = () => {
  const { setOnboardingCompleted } = useOnboardingProgress();

  return (
    <>
      <p className={styles['title']}>
        <T id={'congrats'} />
      </p>
      <p className={styles['description']} style={{ marginBottom: 20 }}>
        <T id={'congratsDescription1'} />
      </p>
      <p className={styles['description']} style={{ marginTop: 20, marginBottom: 0 }}>
        <T id={'congratsDescription2'} />
      </p>
      <p className={styles['description']} style={{ marginTop: 20, marginBottom: 0 }}>
        <T id={'congratsDescription3'} />
      </p>
      <a
        href={'https://www.youtube.com/playlist?list=PLVfSwYHwGJ2Gyyf16LEIgvkNoC1YtgjX1'}
        target="_blank"
        rel="noreferrer"
        className={styles['link']}
      >
        https://www.youtube.com/playlist?list=PLVfSwYHwGJ2Gyyf16LEIgvkNoC1YtgjX1
      </a>
      <p className={styles['description']} style={{ marginTop: 20, marginBottom: 0 }}>
        <T id={'congratsDescription4'} />
      </p>
      <a href={'https://madfish.crunch.help/temple-wallet'} target="_blank" rel="noreferrer" className={styles['link']}>
        https://madfish.crunch.help/temple-wallet
      </a>
      <p className={styles['description']} style={{ marginTop: 20, marginBottom: 10, fontWeight: 'bold' }}>
        <T id={'congratsDescription5'} />
      </p>
      <div className={styles['linksList']}>
        {links.map(({ href, background, Icon }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" className="py-1">
            <div className="w-8 h-8 rounded-md" style={{ background, padding: background ? '0.375rem' : 0 }}>
              <Icon className="h-full w-auto" />
            </div>
          </a>
        ))}
      </div>
      <p className={styles['description']} style={{ marginBottom: 0 }}>
        <T id={'congratsDescription6'} />
      </p>
      <Button
        className="w-full justify-center border-none"
        style={{
          padding: '10px 2rem',
          background: '#4198e0',
          color: '#ffffff',
          marginTop: '20px',
          borderRadius: 4
        }}
        onClick={() => setOnboardingCompleted(true)}
      >
        <T id={'start'} />
      </Button>
    </>
  );
};

export default CongratsPage;
