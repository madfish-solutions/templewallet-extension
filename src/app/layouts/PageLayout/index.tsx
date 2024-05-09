import React, { FC, Suspense } from 'react';

import clsx from 'clsx';

import { ContentFader } from 'app/a11y/ContentFader';
import DocBg from 'app/a11y/DocBg';
import Spinner from 'app/atoms/Spinner/Spinner';
import { useAppEnv } from 'app/env';
import ErrorBoundary from 'app/ErrorBoundary';
import { AdvertisingOverlay } from 'app/templates/advertising/advertising-overlay/advertising-overlay';
import { useTempleClient } from 'lib/temple/front';

import { LAYOUT_CONTAINER_CLASSNAME } from '../containers';

import { ChangelogOverlay } from './ChangelogOverlay/ChangelogOverlay';
import ConfirmationOverlay from './ConfirmationOverlay';
import { DefaultHeader, DefaultHeaderProps } from './DefaultHeader';
import { NewsletterOverlay } from './NewsletterOverlay/NewsletterOverlay';
import { OnRampOverlay } from './OnRampOverlay/OnRampOverlay';
import { ShortcutAccountSwitchOverlay } from './ShortcutAccountSwitchOverlay';

export interface PageLayoutProps extends DefaultHeaderProps {
  /** With this given, header props are ignored */
  Header?: React.ComponentType;
  contentPadding?: boolean;
}

const PageLayout: FC<PropsWithChildren<PageLayoutProps>> = ({
  Header,
  children,
  contentPadding = true,
  ...headerProps
}) => {
  const { fullPage } = useAppEnv();
  const { ready } = useTempleClient();

  return (
    <>
      <DocBg bgClassName="bg-secondary-low" />

      <div className={clsx(fullPage && 'pt-9 pb-8')}>
        <ContentPaper>
          {Header ? <Header /> : <DefaultHeader {...headerProps} />}

          <div className={clsx('flex-1 flex flex-col', contentPadding && 'p-4 pb-15')}>
            <ErrorBoundary whileMessage="displaying this page">
              <Suspense fallback={<SpinnerSection />}>{children}</Suspense>
            </ErrorBoundary>
          </div>
        </ContentPaper>
      </div>

      <AdvertisingOverlay />
      <ConfirmationOverlay />
      <ChangelogOverlay />
      <OnRampOverlay />
      <NewsletterOverlay />
      {ready && <ShortcutAccountSwitchOverlay />}
    </>
  );
};

export default PageLayout;

const ContentPaper: FC<PropsWithChildren> = ({ children }) => {
  const appEnv = useAppEnv();

  return (
    <div
      className={clsx(
        LAYOUT_CONTAINER_CLASSNAME,
        'relative flex flex-col bg-white',
        appEnv.fullPage && 'rounded-md shadow-bottom'
      )}
      style={appEnv.fullPage ? { minHeight: '20rem' } : undefined}
    >
      {children}

      <ContentFader />
    </div>
  );
};

export const SpinnerSection: FC = () => (
  <div className="flex justify-center mt-24">
    <Spinner className="w-20" />
  </div>
);
