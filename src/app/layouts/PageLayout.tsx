import React, {
  ComponentProps,
  FC,
  ReactNode,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import clsx from 'clsx';

import { ContentFader } from 'app/a11y/ContentFader';
import DocBg from 'app/a11y/DocBg';
import { Button } from 'app/atoms/Button';
import { DonationBanner } from 'app/atoms/DonationBanner/DonationBanner';
import Spinner from 'app/atoms/Spinner/Spinner';
import { useAppEnv } from 'app/env';
import ErrorBoundary from 'app/ErrorBoundary';
import { ReactComponent as ChevronLeftIcon } from 'app/icons/chevron-left.svg';
import { ContentContainer } from 'app/layouts/ContentContainer';
import { useOnboardingProgress } from 'app/pages/Onboarding/hooks/useOnboardingProgress.hook';
import { AdvertisingBanner } from 'app/templates/advertising/advertising-banner/advertising-banner';
import { AdvertisingOverlay } from 'app/templates/advertising/advertising-overlay/advertising-overlay';
import { T } from 'lib/i18n';
import { OldNotificationsBell } from 'lib/notifications/components/bell';
import { useTempleClient } from 'lib/temple/front';
import { goBack, HistoryAction, navigate, useLocation } from 'lib/woozie';

import { AppHeader } from './PageLayout/AppHeader';
import { ChangelogOverlay } from './PageLayout/ChangelogOverlay/ChangelogOverlay';
import ConfirmationOverlay from './PageLayout/ConfirmationOverlay';
// import Header from './PageLayout/Header';
import { NewsletterOverlay } from './PageLayout/NewsletterOverlay/NewsletterOverlay';
import { OnRampOverlay } from './PageLayout/OnRampOverlay/OnRampOverlay';
import { ShortcutAccountSwitchOverlay } from './PageLayout/ShortcutAccountSwitchOverlay';
import { PageLayoutSelectors } from './PageLayout.selectors';

interface PageLayoutProps extends PropsWithChildren, ToolbarProps {
  contentPadding?: boolean;
}

// @ts-expect-error
const PageLayout: FC<PageLayoutProps> = ({ children, contentPadding = true, ...toolbarProps }) => {
  const { fullPage } = useAppEnv();
  const { ready } = useTempleClient();

  return (
    <>
      <DocBg bgClassName="bg-secondary-low" />

      <div className={clsx(fullPage && 'pt-9 pb-8')}>
        {/* <Header /> */}

        <ContentPaper>
          {/* <Toolbar {...toolbarProps} /> */}
          {ready && <AppHeader />}

          <div className={clsx('flex flex-col', contentPadding && 'p-4 pb-15')}>
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

type ContentPaperProps = ComponentProps<typeof ContentContainer>;

const ContentPaper: FC<ContentPaperProps> = ({ className, style, children, ...rest }) => {
  const appEnv = useAppEnv();

  return (
    <ContentContainer
      className={clsx('relative bg-white overflow-hidden', appEnv.fullPage && 'rounded-md shadow-bottom', className)}
      style={appEnv.fullPage ? { minHeight: '20rem', ...style } : style}
      {...rest}
    >
      {children}

      <ContentFader />
    </ContentContainer>
  );
};

export const SpinnerSection: FC = () => (
  <div className="flex justify-center mt-24">
    <Spinner className="w-20" />
  </div>
);

interface ToolbarProps {
  pageTitle?: ReactNode;
  hasBackAction?: boolean;
  step?: number;
  setStep?: (step: number) => void;
  withToolbarAd?: boolean;
  skip?: boolean;
  attention?: boolean;
}

export let ToolbarElement: HTMLDivElement | null = null;

/** Defined for reference in code to highlight relation between multiple sticky elements & their sizes */
export const TOOLBAR_IS_STICKY = true;

// @ts-expect-error
const Toolbar: FC<ToolbarProps> = ({
  pageTitle,
  hasBackAction = true,
  step,
  setStep,
  withToolbarAd = false,
  skip,
  attention
}) => {
  const { historyPosition, pathname } = useLocation();
  const { fullPage } = useAppEnv();
  const { setOnboardingCompleted } = useOnboardingProgress();

  const onStepBack = () => {
    if (step && setStep && step > 0) {
      setStep(step - 1);
    }
  };

  const inHome = pathname === '/';
  const properHistoryPosition = historyPosition > 0 || !inHome;
  const canBack = hasBackAction && properHistoryPosition;
  const canStepBack = Boolean(step) && step! > 0;
  const isBackButtonAvailable = canBack || canStepBack;

  const handleBack = () => {
    if (canBack) {
      return goBack();
    }

    navigate('/', HistoryAction.Replace);
  };

  const [sticked, setSticked] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>();

  useEffect(() => {
    const toolbarEl = rootRef.current;
    if ('IntersectionObserver' in window && toolbarEl) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setSticked(entry.boundingClientRect.y < entry.rootBounds!.y);
        },
        { threshold: [1] }
      );

      observer.observe(toolbarEl);
      return () => {
        observer.unobserve(toolbarEl);
      };
    }
    return undefined;
  }, [setSticked]);

  const updateRootRef = useCallback((elem: HTMLDivElement | null) => {
    rootRef.current = elem;
    ToolbarElement = elem;
  }, []);

  const className = useMemo(
    () =>
      clsx(
        // The top value needs to be -1px or the element will never intersect
        // with the top of the browser window
        // (thus never triggering the intersection observer).
        TOOLBAR_IS_STICKY && 'sticky z-20 -top-px',
        'flex items-center py-2 px-4 min-h-11',
        fullPage && !sticked && 'rounded-t',
        sticked ? 'shadow' : 'shadow-sm',
        'bg-gray-100 overflow-hidden transition ease-in-out duration-300'
      ),
    [sticked, fullPage]
  );

  return (
    <div ref={updateRootRef} className={className}>
      <div className="flex-1">
        {!isBackButtonAvailable && withToolbarAd && <DonationBanner />}

        {isBackButtonAvailable && (
          <Button
            className={clsx(
              'rounded px-2 py-1',
              'flex items-center',
              'text-gray-600 text-shadow-black',
              'text-sm font-semibold leading-none',
              'hover:bg-black hover:bg-opacity-5',
              'transition duration-300 ease-in-out',
              'opacity-90 hover:opacity-100'
            )}
            onClick={step ? onStepBack : handleBack}
            testID={PageLayoutSelectors.backButton}
          >
            <ChevronLeftIcon className="-ml-2 h-5 w-auto stroke-current stroke-2" />
            <T id="back" />
          </Button>
        )}
      </div>

      {pageTitle && (
        <h2 className="px-1 flex items-center text-ulg text-gray-700 font-normal overflow-hidden">{pageTitle}</h2>
      )}

      <div className="flex-1" />

      {attention && (
        <div className="flex items-center content-end absolute right-0">
          <AdvertisingBanner />
          <OldNotificationsBell />
        </div>
      )}

      {skip && (
        <div className="flex content-end">
          <Button
            className={clsx(
              'flex items-center px-4 py-2 rounded',
              'text-sm font-semibold leading-none text-gray-600 text-shadow-black',
              'opacity-90 hover:opacity-100 hover:bg-black hover:bg-opacity-5',
              'transition duration-300 ease-in-out'
            )}
            onClick={() => setOnboardingCompleted(true)}
            testID={PageLayoutSelectors.skipButton}
          >
            <T id="skip" />
          </Button>
        </div>
      )}
    </div>
  );
};
