import React, { FC, useMemo } from 'react';

import { ReactComponent as CannyIcon } from 'app/icons/canny.svg';
import { ReactComponent as DiscordIcon } from 'app/icons/discord.svg';
import { ReactComponent as HelpCrunchIcon } from 'app/icons/helpcrunch.svg';
import { ReactComponent as RedditIcon } from 'app/icons/reddit.svg';
import { ReactComponent as TelegramIcon } from 'app/icons/telegram.svg';
import { ReactComponent as TwitterIcon } from 'app/icons/twitter.svg';
import { ReactComponent as YoutubeIcon } from 'app/icons/youtube.svg';
import { T } from 'lib/i18n';

import { ResourceLink } from './ResourceLink';
import { HelpAndCommunitySelectors } from './selectors';

const HelpAndCommunity: FC = () => {
  const generalLinks = useMemo(
    () => [
      {
        title: 'Knowledge Base',
        href: 'https://madfish.crunch.help/temple-wallet',
        background: '#2182f7',
        Icon: HelpCrunchIcon,
        testID: HelpAndCommunitySelectors.knowledgeBaseLinkButton
      },
      {
        title: 'Feature Request',
        href: 'https://madfish.canny.io/feature-requests',
        Icon: CannyIcon,
        testID: HelpAndCommunitySelectors.featureRequestLinkButton
      }
    ],
    []
  );

  const socialMediaLinks = useMemo(
    () => [
      {
        title: 'Twitter',
        href: 'https://twitter.com/madfishofficial',
        background: '#1DA1F2',
        Icon: TwitterIcon
      },
      {
        title: 'Telegram',
        href: 'https://t.me/MadFishCommunity',
        background: '#26A5E4',
        Icon: TelegramIcon
      },
      {
        title: 'Discord',
        href: 'https://www.madfish.solutions/discord',
        background: '#7289DA',
        Icon: DiscordIcon
      },
      {
        title: 'Reddit',
        href: 'https://www.reddit.com/r/MadFishCommunity',
        background: '#FF4500',
        Icon: RedditIcon
      },
      {
        title: 'Youtube',
        href: 'https://www.youtube.com/channel/UCUp80EXfJEigks3xU5hiwyA',
        background: '#FF0000',
        Icon: YoutubeIcon
      }
    ],
    []
  );

  return (
    <div className="w-full max-w-sm mx-auto my-8 text-sm text-gray-700">
      <p>
        <T id="communityResourcesTitle" />
      </p>

      <ul className="my-2">
        {generalLinks.map(({ title, ...props }) => (
          <ResourceLink key={title} title={title} {...props} />
        ))}
        {socialMediaLinks.map(({ title, ...props }) => (
          <ResourceLink
            key={title}
            title={title}
            {...props}
            testID={HelpAndCommunitySelectors.socialMediaLinkButton}
            testIDProperties={{ media: title }}
          />
        ))}
      </ul>

      <p>
        <T id="joinPrompt" />
      </p>
    </div>
  );
};

export default HelpAndCommunity;
