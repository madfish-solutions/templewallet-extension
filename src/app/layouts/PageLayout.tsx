import React, { ComponentProps, FC, ReactNode, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';

import classNames from 'clsx';

import DocBg from 'app/a11y/DocBg';
import { Button } from 'app/atoms/Button';
import Spinner from 'app/atoms/Spinner/Spinner';
import { useAppEnv } from 'app/env';
import ErrorBoundary from 'app/ErrorBoundary';
import { ReactComponent as ChevronLeftIcon } from 'app/icons/chevron-left.svg';
import ContentContainer from 'app/layouts/ContentContainer';
import { isSafeBrowserVersion } from 'lib/browser-info';
import { T } from 'lib/i18n/react';
import { PropsWithChildren } from 'lib/props-with-children';
import { goBack, HistoryAction, Link, navigate, useLocation } from 'lib/woozie';

import { AnalyticsEventCategory, useAnalytics } from '../../lib/analytics';
import { DonationBanner } from '../atoms/DonationBanner';
import { ReactComponent as AttentionGreyIcon } from '../icons/attentionGrey.svg';
import { ReactComponent as AttentionRedIcon } from '../icons/attentionRed.svg';
import { ReactComponent as DownloadMobileGreyIcon } from '../icons/download-mobile-grey.svg';
import { ReactComponent as DownloadMobileIcon } from '../icons/download-mobile.svg';
import { useOnboardingProgress } from '../pages/Onboarding/hooks/useOnboardingProgress.hook';
import { PageLayoutSelectors } from './PageLayout.selectors';
import { ChangelogOverlay } from './PageLayout/ChangelogOverlay/ChangelogOverlay';
import ConfirmationOverlay from './PageLayout/ConfirmationOverlay';
import Header from './PageLayout/Header';
import { useTempleMobile } from './PageLayout/hooks/useTempleMobile.hook';
import { TempleMobileSelectors } from './PageLayout/TempleMobile.selectors';

interface PageLayoutProps extends PropsWithChildren, ToolbarProps {
  contentContainerStyle?: React.CSSProperties;
}

const PageLayout: FC<PageLayoutProps> = ({ children, contentContainerStyle, ...toolbarProps }) => {
  const { fullPage } = useAppEnv();

  return (
    <>
      <DocBg bgClassName="bg-primary-orange" />

      <div className={classNames(fullPage && 'pb-20', 'relative')}>
        <Header />

        <ContentPaper>
          <Toolbar {...toolbarProps} />

          <div className="p-4" style={contentContainerStyle}>
            <ErrorBoundary whileMessage="displaying this page">
              <Suspense fallback={<SpinnerSection />}>{children}</Suspense>
            </ErrorBoundary>
          </div>
        </ContentPaper>
      </div>

      <ConfirmationOverlay />
      <ChangelogOverlay />
    </>
  );
};

export default PageLayout;

type ContentPaparProps = ComponentProps<typeof ContentContainer>;

const ContentPaper: FC<ContentPaparProps> = ({ className, style = {}, children, ...rest }) => {
  const appEnv = useAppEnv();

  return appEnv.fullPage ? (
    <ContentContainer>
      <div
        className={classNames('bg-white', 'rounded-md shadow-lg', className)}
        style={{ minHeight: '20rem', ...style }}
        {...rest}
      >
        {children}
      </div>
    </ContentContainer>
  ) : (
    <ContentContainer padding={false} className={classNames('bg-white', className)} style={style} {...rest}>
      {children}
    </ContentContainer>
  );
};

const SpinnerSection: FC = () => (
  <div className="flex justify-center mt-24">
    <Spinner className="w-20" />
  </div>
);

type ToolbarProps = {
  pageTitle?: ReactNode;
  hasBackAction?: boolean;
  step?: number;
  setStep?: (step: number) => void;
  adShow?: boolean;
  skip?: boolean;
  attention?: boolean;
};

const Toolbar: FC<ToolbarProps> = ({
  pageTitle,
  hasBackAction = true,
  step,
  setStep,
  adShow = false,
  skip,
  attention
}) => {
  const { historyPosition, pathname } = useLocation();
  const { fullPage, registerBackHandler, onBack } = useAppEnv();
  const { setOnboardingCompleted } = useOnboardingProgress();
  const { trackEvent } = useAnalytics();

  const { isTempleMobileOverlaySkipped, setIsTempleMobileOverlaySkipped } = useTempleMobile();

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

  useLayoutEffect(() => {
    return registerBackHandler(() => {
      switch (true) {
        case historyPosition > 0:
          goBack();
          break;

        case !inHome:
          navigate('/', HistoryAction.Replace);
          break;
      }
    });
  }, [registerBackHandler, historyPosition, inHome]);

  const [sticked, setSticked] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);

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

  const handleDownloadMobileIconClick = () => {
    trackEvent(TempleMobileSelectors.DownloadIcon, AnalyticsEventCategory.ButtonPress);
    setIsTempleMobileOverlaySkipped(false);
  };

  return (
    <div
      ref={rootRef}
      className={classNames(
        'sticky z-20',
        fullPage && !sticked && 'rounded-t',
        sticked ? 'shadow' : 'shadow-sm',
        'bg-gray-100',
        'overflow-hidden',
        'py-2 px-4',
        'flex items-center',
        'transition ease-in-out duration-300'
      )}
      style={{
        // The top value needs to be -1px or the element will never intersect
        // with the top of the browser window
        // (thus never triggering the intersection observer).
        top: -1,
        minHeight: '2.75rem'
      }}
    >
      <div className="flex-1">
        {!isBackButtonAvailable && adShow && <DonationBanner />}
        {isBackButtonAvailable && (
          <Button
            className={classNames(
              'rounded',
              'flex items-center',
              'text-gray-600 text-shadow-black',
              'text-sm font-semibold leading-none',
              'hover:bg-black hover:bg-opacity-5',
              'transition duration-300 ease-in-out',
              'opacity-90 hover:opacity-100'
            )}
            onClick={step ? onStepBack : onBack}
            testID={PageLayoutSelectors.BackButton}
          >
            <ChevronLeftIcon className={classNames('-ml-2', 'h-5 w-auto', 'stroke-current', 'stroke-2')} />
            <T id="back" />
          </Button>
        )}
      </div>

      {pageTitle && (
        <h2
          className={classNames('px-1', 'flex items-center', 'text-gray-700', 'font-normal leading-none')}
          style={{ fontSize: 17 }}
        >
          {pageTitle}
        </h2>
      )}

      <div className="flex-1" />
      {attention && (
        <div className="flex items-center content-end absolute right-0">
          <a
            href="https://templewallet.com/mobile"
            target="_blank"
            rel="noopener noreferrer"
            className="mr-3 my-auto"
            onClick={handleDownloadMobileIconClick}
          >
            {isTempleMobileOverlaySkipped ? <DownloadMobileIcon /> : <DownloadMobileGreyIcon />}
          </a>

          <Link to={'/attention'} className="mr-3">
            {isSafeBrowserVersion ? <AttentionGreyIcon /> : <AttentionRedIcon />}
          </Link>
        </div>
      )}
      {skip && (
        <div className="flex content-end">
          <Button
            className={classNames(
              'px-4 py-2',
              'rounded',
              'flex items-center',
              'text-gray-600 text-shadow-black',
              'text-sm font-semibold leading-none',
              'hover:bg-black hover:bg-opacity-5',
              'transition duration-300 ease-in-out',
              'opacity-90 hover:opacity-100'
            )}
            onClick={() => setOnboardingCompleted(true)}
          >
            <T id="skip" />
          </Button>
        </div>
      )}
    </div>
  );
};
