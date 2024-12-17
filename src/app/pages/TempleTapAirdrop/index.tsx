import React, { FC, memo, PropsWithChildren, useMemo } from 'react';

import { Alert, Anchor } from 'app/atoms';
import { ReactComponent as TelegramSvg } from 'app/icons/social-tg.svg';
import { ReactComponent as XSocialSvg } from 'app/icons/social-x.svg';
import PageLayout from 'app/layouts/PageLayout';
import { useAccount } from 'lib/temple/front';
import { TempleAccountType } from 'lib/temple/types';

import BannerImgSrc from './banner.png';

export const TempleTapAirdropPage = memo(() => {
  const account = useAccount();

  const canSign = useMemo(
    () => [TempleAccountType.HD, TempleAccountType.Imported, TempleAccountType.Ledger].includes(account.type),
    [account.type]
  );

  return (
    <PageLayout pageTitle="Temple Tap Airdrop" withBell>
      <div className="flex flex-col w-full max-w-sm mx-auto pb-6">
        <img src={BannerImgSrc} alt="Banner" className="self-center h-28" />

        <span className="mt-6 text-dark font-semibold" style={{ fontSize: 19 }}>
          Airdrop criteria
        </span>

        <p className="mt-2 text-dark-gray text-sm">
          All users who played Temple Tap are eligible to share the prize pool and receive a TKEY airdrop directly to
          Tezos address.
        </p>

        <span className="mt-8 text-dark-gray text-base leading-tighter font-medium">How to receive TKEY?</span>

        {canSign ? (
          <BlockComp
            title="Confirm address"
            description="Enter your telegram @username to confirm your Tezos address in Temple Tap bot for future airdrop distribution"
          >
            <div className="text-xs leading-5 text-dark-gray">
              <span>Your address: </span>
              <span>{account.publicKeyHash}</span>
            </div>
          </BlockComp>
        ) : (
          <Alert description="Please, use a signer account first." className="mt-4" />
        )}

        <BlockComp
          title="Stay tuned for news"
          description="Follow us on social media to be the first to hear about airdrop updates!"
        >
          <div className="h-1" />

          <SocialItem title="Temple Wallet on X" IconComp={XSocialSvg} followUrl="https://x.com/TempleWallet" />

          <SocialItem title="MadFish Community" IconComp={TelegramSvg} followUrl="https://t.me/MadFishCommunity" />
        </BlockComp>
      </div>
    </PageLayout>
  );
});

interface BlockCompProps {
  title: string;
  description: string;
}

const BlockComp: FC<PropsWithChildren<BlockCompProps>> = ({ title, description, children }) => (
  <div className="mt-4 flex flex-col p-4 bg-gray-100 rounded-xl">
    <span className="text-sm font-semibold text-dark">{title}</span>

    <p className="my-1 text-xs leading-5 text-gray-600">{description}</p>

    {children}
  </div>
);

interface SocialItemProps {
  title: string;
  IconComp: ImportedSVGComponent;
  followUrl: string;
}

const SocialItem: FC<SocialItemProps> = ({ title, IconComp, followUrl }) => (
  <div className="mt-2 flex items-center gap-x-3 py-3 px-4 bg-white rounded-xl">
    <div className="w-10 h-10 p-3 bg-blue-150 rounded-full">
      <IconComp className="w-4 h-4 stroke-current fill-current text-dark" />
    </div>

    <span className="flex-grow text-sm font-semibold text-dark">{title}</span>

    <Anchor href={followUrl} className="p-2 text-sm leading-none font-semibold text-white bg-blue-550 rounded-lg">
      Follow
    </Anchor>
  </div>
);
