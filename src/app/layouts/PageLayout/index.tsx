import React, { ComponentType, FC, memo, ReactNode, useRef } from 'react';

import clsx from 'clsx';

import { ContentFader } from 'app/a11y/ContentFader';
import DocBg from 'app/a11y/DocBg';
import Spinner from 'app/atoms/Spinner/Spinner';
import { SuspenseContainer } from 'app/atoms/SuspenseContainer';
import { useAppEnv } from 'app/env';
import { useScrollEdgesVisibility } from 'app/hooks/use-scroll-edges-visibility';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { AdvertisingOverlay } from 'app/templates/advertising/advertising-overlay/advertising-overlay';
import { SHOULD_BACKUP_MNEMONIC_STORAGE_KEY } from 'lib/constants';
import { IS_MISES_BROWSER } from 'lib/env';
import { T } from 'lib/i18n';
import { useStorage, useTempleClient } from 'lib/temple/front';

import {
  SCROLL_DOCUMENT,
  APP_CONTENT_PAPER_DOM_ID,
  APP_CONTENT_WRAP_DOM_ID,
  LAYOUT_CONTAINER_CLASSNAME,
  FULL_PAGE_WRAP_CLASSNAME
} from '../containers';

import { BackupMnemonicOverlay } from './BackupMnemonicOverlay';
import { ChangelogOverlay } from './ChangelogOverlay/ChangelogOverlay';
import ConfirmationOverlay from './ConfirmationOverlay';
import { ContentPaperRefContext } from './context';
import { DefaultHeader, DefaultHeaderProps } from './DefaultHeader';
import { NewsletterOverlay } from './NewsletterOverlay/NewsletterOverlay';
import { OnRampOverlay } from './OnRampOverlay/OnRampOverlay';
import { ReactivateAdsOverlay } from './ReactivateAdsOverlay';
import { ScrollRestorer } from './ScrollRestorer';
import { ShortcutAccountSwitchOverlay } from './ShortcutAccountSwitchOverlay';

interface ScrollEdgesVisibilityProps {
  onBottomEdgeVisibilityChange?: SyncFn<boolean>;
  bottomEdgeThreshold?: number;
  onTopEdgeVisibilityChange?: SyncFn<boolean>;
  topEdgeThreshold?: number;
}

export interface PageLayoutProps extends DefaultHeaderProps, ScrollEdgesVisibilityProps {
  /** With this given, header props are ignored */
  Header?: ComponentType;
  noScroll?: boolean;
  contentPadding?: boolean;
  contentClassName?: string;
  paperClassName?: string;
  headerChildren?: ReactNode;
}

const PageLayout: FC<PropsWithChildren<PageLayoutProps>> = ({
  Header,
  children,
  noScroll = false,
  contentPadding = true,
  contentClassName,
  paperClassName,
  headerChildren,
  onBottomEdgeVisibilityChange,
  bottomEdgeThreshold,
  onTopEdgeVisibilityChange,
  topEdgeThreshold,
  ...headerProps
}) => {
  const { fullPage, confirmWindow } = useAppEnv();
  const { ready } = useTempleClient();
  const [shouldBackupMnemonic] = useStorage(SHOULD_BACKUP_MNEMONIC_STORAGE_KEY, false);

  return (
    <>
      {
        /*
          Mises browser has an issue with <html>'s height - not reaching 100% no matter what CSS,
          unless it is expanded by content. We at least won't color it to not highlight that.
        */
        !IS_MISES_BROWSER && <DocBg bgClassName="bg-secondary-low" />
      }

      <div id={APP_CONTENT_WRAP_DOM_ID} className={clsx(fullPage && !confirmWindow && FULL_PAGE_WRAP_CLASSNAME)}>
        <ContentPaper
          className={paperClassName}
          onBottomEdgeVisibilityChange={onBottomEdgeVisibilityChange}
          bottomEdgeThreshold={bottomEdgeThreshold}
          onTopEdgeVisibilityChange={onTopEdgeVisibilityChange}
          topEdgeThreshold={topEdgeThreshold}
        >
          {Header ? <Header /> : <DefaultHeader {...headerProps}>{headerChildren}</DefaultHeader>}

          <div
            className={clsx(
              'flex-grow flex flex-col',
              noScroll && 'overflow-hidden',
              contentPadding && 'p-4 pb-15',
              'bg-background',
              contentClassName
            )}
          >
            <SuspenseContainer errorMessage="displaying this page">{children}</SuspenseContainer>
          </div>
        </ContentPaper>
      </div>

      <AdvertisingOverlay />
      <ConfirmationOverlay />
      <ChangelogOverlay />
      {!shouldBackupMnemonic && ready && (
        <>
          <OnRampOverlay />
          <NewsletterOverlay />
          <ReactivateAdsOverlay />
        </>
      )}
      {ready && (
        <>
          <ShortcutAccountSwitchOverlay />
          {shouldBackupMnemonic && <BackupMnemonicOverlay />}
        </>
      )}
    </>
  );
};

export default PageLayout;

type ContentPaperProps = PropsWithChildren<{ className?: string } & ScrollEdgesVisibilityProps>;

const ContentPaper: FC<ContentPaperProps> = ({
  children,
  className,
  bottomEdgeThreshold,
  topEdgeThreshold,
  onBottomEdgeVisibilityChange,
  onTopEdgeVisibilityChange
}) => {
  const appEnv = useAppEnv();
  const rootRef = useRef<HTMLDivElement>(null);

  useScrollEdgesVisibility(
    rootRef,
    onBottomEdgeVisibilityChange,
    bottomEdgeThreshold,
    onTopEdgeVisibilityChange,
    topEdgeThreshold
  );

  return (
    <ContentPaperRefContext.Provider value={rootRef}>
      <ContentPaperNode
        ref={rootRef}
        id={APP_CONTENT_PAPER_DOM_ID}
        className={clsx(
          LAYOUT_CONTAINER_CLASSNAME,
          'relative flex flex-col bg-white',
          !SCROLL_DOCUMENT && 'overflow-y-auto',
          appEnv.fullPage && 'min-h-80 rounded-md shadow-bottom',
          className
        )}
      >
        <TestnetModeIndicator />

        {children}

        <ContentFader />
      </ContentPaperNode>
    </ContentPaperRefContext.Provider>
  );
};

const ContentPaperNode = SCROLL_DOCUMENT ? 'div' : ScrollRestorer;

const TestnetModeIndicator = memo(() => {
  const enabled = useTestnetModeEnabledSelector();

  return (
    <div
      className={clsx(
        'flex justify-center items-center sticky z-sticky top-0 bg-success',
        'transition-all ease-in-out duration-300',
        enabled ? 'min-h-6 h-6' : 'min-h-0 h-0'
      )}
    >
      <span className="text-font-description-bold text-white">
        <T id="testnetMode" />
      </span>
    </div>
  );
});

export const SpinnerSection: FC = () => (
  <div className="flex justify-center mt-24">
    <Spinner className="w-20" />
  </div>
);
