import React, { memo, useCallback, useMemo, useState } from 'react';

import { FadeTransition } from 'app/a11y/FadeTransition';
import { CopyButton, IconBase } from 'app/atoms';
import { VerticalLines } from 'app/atoms/Lines';
import { Logo } from 'app/atoms/Logo';
import { SettingsCellSingle } from 'app/atoms/SettingsCell';
import { SettingsCellGroup } from 'app/atoms/SettingsCellGroup';
import { TextButton } from 'app/atoms/TextButton';
import { useReferralUserId, useRegisterReferralWalletIfPossible } from 'app/hooks/use-conversion-verification';
import { ReactComponent as CopyIcon } from 'app/icons/base/copy.svg';
import { ReactComponent as DiscordIcon } from 'app/icons/monochrome/discord.svg';
import { ReactComponent as KnowledgeBaseIcon } from 'app/icons/monochrome/knowledge-base.svg';
import { ReactComponent as RedditIcon } from 'app/icons/monochrome/reddit.svg';
import { ReactComponent as TelegramIcon } from 'app/icons/monochrome/telegram.svg';
import { ReactComponent as XSocialIcon } from 'app/icons/monochrome/x-social.svg';
import { ReactComponent as YoutubeIcon } from 'app/icons/monochrome/youtube.svg';
import { toastError } from 'app/toaster';
import { getRefLink, getReferrersCount } from 'lib/apis/temple';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from 'lib/constants';
import { EnvVars } from 'lib/env';
import { T, t } from 'lib/i18n';
import { useTypedSWR } from 'lib/swr';

import { AboutSelectors } from './About.selectors';
import { LinkProps } from './links-group-item';
import { LinksGroupView } from './links-group-view';

const LINKS: LinkProps[] = [
  {
    key: 'website',
    link: 'https://templewallet.com',
    testID: AboutSelectors.websiteLink
  },
  {
    key: 'repo',
    link: 'https://github.com/madfish-solutions/templewallet-extension',
    testID: AboutSelectors.repoLink
  },
  {
    key: 'privacyPolicy',
    link: PRIVACY_POLICY_URL,
    testID: AboutSelectors.privacyPolicyLink
  },
  {
    key: 'termsOfUse',
    link: TERMS_OF_USE_URL,
    testID: AboutSelectors.termsOfUseLink
  }
];

const COMMUNITY_LINKS: LinkProps[] = [
  {
    key: 'knowledgeBase',
    link: 'https://madfish.crunch.help/en/temple-wallet',
    testID: AboutSelectors.knowledgeBaseLink,
    Icon: KnowledgeBaseIcon
  },
  {
    key: 'featureRequest',
    link: 'https://madfish.canny.io/feature-requests',
    testID: AboutSelectors.featureRequestLink,
    Icon: KnowledgeBaseIcon
  },
  {
    key: 'xSocial',
    link: 'https://x.com/madfishofficial',
    testID: AboutSelectors.xSocialLink,
    Icon: XSocialIcon
  },
  {
    key: 'telegram',
    link: 'https://t.me/MadFishCommunity',
    testID: AboutSelectors.telegramLink,
    Icon: TelegramIcon
  },
  {
    key: 'discord',
    link: 'https://www.madfish.solutions/discord',
    testID: AboutSelectors.discordLink,
    Icon: DiscordIcon
  },
  {
    key: 'reddit',
    link: 'https://www.reddit.com/r/MadFishCommunity',
    testID: AboutSelectors.redditLink,
    Icon: RedditIcon
  },
  {
    key: 'youtube',
    link: 'https://www.youtube.com/channel/UCUp80EXfJEigks3xU5hiwyA',
    testID: AboutSelectors.youtubeLink,
    Icon: YoutubeIcon
  }
];

export const About = memo(() => {
  const branch = EnvVars.TEMPLE_WALLET_DEVELOPMENT_BRANCH_NAME;
  const version = process.env.VERSION;
  const [refLink, setRefLink] = useState<string | null>(null);
  const [userId] = useReferralUserId();
  const registerReferralWalletIfPossible = useRegisterReferralWalletIfPossible();

  const generateRefLink = useCallback(async () => {
    try {
      const currentUserId = userId ?? (await registerReferralWalletIfPossible());
      setRefLink(await getRefLink(currentUserId!));
    } catch (error) {
      console.error(error);
      toastError('Failed to generate referral link');
    }
  }, [registerReferralWalletIfPossible, userId]);
  const fetchReferrersCount = useMemo(() => (userId ? () => getReferrersCount(userId) : null), [userId]);
  const { data: referrersCount } = useTypedSWR(['referrersCount', userId], fetchReferrersCount, { suspense: false });

  return (
    <FadeTransition>
      <div className="flex flex-col gap-4">
        <SettingsCellGroup>
          <SettingsCellSingle
            Component="div"
            isLast
            className="p-4 gap-3"
            cellIcon={<Logo type="icon" />}
            wrapCellName={false}
            cellName={
              <div className="flex flex-col gap-1">
                <p className="text-font-medium-bold">
                  <T id="appName" />
                </p>
                <div className="inline-flex flex-wrap gap-1.5 text-font-description text-grey-1">
                  <span>
                    <T id="versionLabel" substitutions={version} />
                  </span>
                  {/* `branch` is equal to `version` in releases */}
                  {branch && branch !== version && (
                    <>
                      <VerticalLines className="py-0.5" />
                      <span>
                        <T id="branchName" substitutions={branch} />
                      </span>
                    </>
                  )}
                </div>
              </div>
            }
          />
        </SettingsCellGroup>
        <LinksGroupView group={{ title: t('links'), links: LINKS }} />
        <LinksGroupView group={{ title: t('community'), links: COMMUNITY_LINKS }} />
        {refLink ? (
          <CopyButton text={refLink} className="text-secondary flex text-font-description-bold items-center">
            <span>Copy the link to share</span>
            <IconBase size={12} Icon={CopyIcon} />
          </CopyButton>
        ) : (
          <TextButton color="blue" onClick={generateRefLink}>
            Share
          </TextButton>
        )}
        {referrersCount !== undefined && (
          <p className="text-font-description text-grey-1">You have {referrersCount} referrers</p>
        )}
      </div>
    </FadeTransition>
  );
});
