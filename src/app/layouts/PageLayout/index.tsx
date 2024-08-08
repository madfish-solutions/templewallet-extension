import React, { createContext, FC, RefObject, useContext, useRef } from 'react';

import clsx from 'clsx';

import { ContentFader } from 'app/a11y/ContentFader';
import DocBg from 'app/a11y/DocBg';
import Spinner from 'app/atoms/Spinner/Spinner';
import { SuspenseContainer } from 'app/atoms/SuspenseContainer';
import { useAppEnv } from 'app/env';
import { AdvertisingOverlay } from 'app/templates/advertising/advertising-overlay/advertising-overlay';
import { IS_MISES_BROWSER } from 'lib/env';
import { useTempleClient } from 'lib/temple/front';

import {
  SCROLL_DOCUMENT,
  APP_CONTENT_PAPER_DOM_ID,
  APP_CONTENT_WRAP_DOM_ID,
  LAYOUT_CONTAINER_CLASSNAME
} from '../containers';

import { ChangelogOverlay } from './ChangelogOverlay/ChangelogOverlay';
import ConfirmationOverlay from './ConfirmationOverlay';
import { DefaultHeader, DefaultHeaderProps } from './DefaultHeader';
import { NewsletterOverlay } from './NewsletterOverlay/NewsletterOverlay';
import { OnRampOverlay } from './OnRampOverlay/OnRampOverlay';
import { ReactivateAdsOverlay } from './ReactivateAdsOverlay';
import { ScrollRestorer } from './ScrollRestorer';
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
      {
        /*
          Mises browser has an issue with <html>'s height - not reaching 100% no matter what CSS,
          unless it is expanded by content. We at least won't color it to not highlight that.
        */
        !IS_MISES_BROWSER && <DocBg bgClassName="bg-secondary-low" />
      }

      <div id={APP_CONTENT_WRAP_DOM_ID} className={clsx(fullPage && 'pt-9 pb-8')}>
        <ContentPaper>
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
      <ReactivateAdsOverlay />
      {ready && <ShortcutAccountSwitchOverlay />}
    </>
  );
};

export default PageLayout;

const ContentPaperRefContext = createContext<RefObject<HTMLDivElement>>({
  current: null
});
export const useContentPaperRef = () => useContext(ContentPaperRefContext);

const ContentPaper: FC<PropsWithChildren> = ({ children }) => {
  const appEnv = useAppEnv();

  const ref = useRef<HTMLDivElement>(null);

  return (
    <ContentPaperRefContext.Provider value={ref}>
      <ContentPaperNode
        ref={ref}
        id={APP_CONTENT_PAPER_DOM_ID}
        className={clsx(
          LAYOUT_CONTAINER_CLASSNAME,
          'relative flex flex-col bg-white',
          !SCROLL_DOCUMENT && 'overflow-y-auto',
          appEnv.fullPage && 'min-h-80 rounded-md shadow-bottom'
        )}
      >
        {children}

        <ContentFader />
      </ContentPaperNode>
    </ContentPaperRefContext.Provider>
  );
};

const ContentPaperNode = SCROLL_DOCUMENT ? 'div' : ScrollRestorer;

export const SpinnerSection: FC = () => (
  <div className="flex justify-center mt-24">
    <Spinner className="w-20" />
  </div>
);
