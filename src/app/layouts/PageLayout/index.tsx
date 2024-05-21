import React, { FC } from 'react';

import clsx from 'clsx';

import { ContentFader } from 'app/a11y/ContentFader';
import DocBg from 'app/a11y/DocBg';
import Spinner from 'app/atoms/Spinner/Spinner';
import { SuspenseContainer } from 'app/atoms/SuspenseContainer';
import { useAppEnv } from 'app/env';
import { AdvertisingOverlay } from 'app/templates/advertising/advertising-overlay/advertising-overlay';
import { useTempleClient } from 'lib/temple/front';

import {
  SCROLL_DOCUMENT,
  APP_CONTENT_PAPER_DOM_ID,
  APP_CONTENT_WRAP_DOM_ID,
  LAYOUT_CONTAINER_CLASSNAME
} from '../containers';

import { BackupMnemonicOverlay } from './BackupMnemonicOverlay';
import { ChangelogOverlay } from './ChangelogOverlay/ChangelogOverlay';
import ConfirmationOverlay from './ConfirmationOverlay';
import { DefaultHeader, DefaultHeaderProps } from './DefaultHeader';
import { NewsletterOverlay } from './NewsletterOverlay/NewsletterOverlay';
import { OnRampOverlay } from './OnRampOverlay/OnRampOverlay';
import { ScrollRestorer } from './ScrollRestorer';
import { ShortcutAccountSwitchOverlay } from './ShortcutAccountSwitchOverlay';

export interface PageLayoutProps extends DefaultHeaderProps {
  /** With this given, header props are ignored */
  Header?: React.ComponentType;
  contentPadding?: boolean;
  shouldTakeAllHeight?: boolean;
}

const PageLayout: FC<PropsWithChildren<PageLayoutProps>> = ({
  Header,
  children,
  contentPadding = true,
  shouldTakeAllHeight = false,
  ...headerProps
}) => {
  const { fullPage } = useAppEnv();
  const { ready } = useTempleClient();

  return (
    <>
      <DocBg bgClassName="bg-secondary-low" />

      <div id={APP_CONTENT_WRAP_DOM_ID} className={clsx(fullPage && 'pt-9 pb-8', shouldTakeAllHeight && 'h-[100vh]')}>
        <ContentPaper shouldTakeAllHeight={shouldTakeAllHeight}>
          {Header ? <Header /> : <DefaultHeader {...headerProps} />}

          <div className={clsx('flex-1 flex flex-col', contentPadding && 'p-4 pb-15')}>
            <SuspenseContainer errorMessage="displaying this page">{children}</SuspenseContainer>
          </div>
        </ContentPaper>
      </div>

      <AdvertisingOverlay />
      <ConfirmationOverlay />
      <ChangelogOverlay />
      <OnRampOverlay />
      <NewsletterOverlay />
      {ready && (
        <>
          <ShortcutAccountSwitchOverlay />
          <BackupMnemonicOverlay />
        </>
      )}
    </>
  );
};

export default PageLayout;

type ContentPaperProps = PropsWithChildren<{ shouldTakeAllHeight: boolean }>;

const ContentPaper: FC<ContentPaperProps> = ({ children, shouldTakeAllHeight }) => {
  const appEnv = useAppEnv();

  return (
    <ContentPaperNode
      id={APP_CONTENT_PAPER_DOM_ID}
      className={clsx(
        LAYOUT_CONTAINER_CLASSNAME,
        'relative flex flex-col bg-white',
        !SCROLL_DOCUMENT && 'overflow-y-auto',
        appEnv.fullPage && 'min-h-80 rounded-md shadow-bottom',
        shouldTakeAllHeight && 'h-full'
      )}
    >
      {children}

      <ContentFader />
    </ContentPaperNode>
  );
};

const ContentPaperNode = SCROLL_DOCUMENT ? 'div' : ScrollRestorer;

export const SpinnerSection: FC = () => (
  <div className="flex justify-center mt-24">
    <Spinner className="w-20" />
  </div>
);
