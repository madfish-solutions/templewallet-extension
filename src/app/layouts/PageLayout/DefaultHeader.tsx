import React, { FC, ReactNode, useMemo, useRef } from 'react';

import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import { Button } from 'app/atoms/Button';
import { ReactComponent as ChevronLeftIcon } from 'app/icons/chevron_left.svg';
import { goBack, HistoryAction, navigate, useLocation } from 'lib/woozie';

import { useStickyObservation } from '../containers';

import { PageLayoutSelectors } from './selectors';

export interface DefaultHeaderProps {
  pageTitle?: ReactNode;
  hasBackAction?: boolean;
  step?: number;
  setStep?: (step: number) => void;
  headerRightElem?: React.ReactNode;
}

const HEADER_IS_STICKY = true;

export const DefaultHeader: FC<DefaultHeaderProps> = ({
  pageTitle,
  hasBackAction = true,
  step,
  setStep,
  headerRightElem
}) => {
  const { historyPosition, pathname } = useLocation();

  const onStepBack = () => {
    if (step && setStep && step > 0) {
      setStep(step - 1);
    }
  };

  const inHome = pathname === '/';
  const properHistoryPosition = historyPosition > 0 || !inHome;
  const canBack = hasBackAction && properHistoryPosition;
  const canStepBack = Boolean(step) && step! > 0;
  const withBackButton = canBack || canStepBack;

  const handleBack = () => {
    if (canBack) {
      return goBack();
    }

    navigate('/', HistoryAction.Replace);
  };

  const rootRef = useRef<HTMLDivElement | null>(null);

  const sticked = useStickyObservation(rootRef, HEADER_IS_STICKY);

  const className = useMemo(
    () =>
      clsx(
        HEADER_IS_STICKY && 'sticky z-header -top-px',
        'flex items-center p-4 min-h-14 bg-white overflow-hidden',
        sticked ? 'shadow' : 'rounded-t-inherit border-b border-lines',
        'ease-in-out duration-300'
      ),
    [sticked]
  );

  return (
    <div ref={rootRef} className={className}>
      <div className="flex-1 flex items-center">
        {withBackButton && (
          <Button className="block" onClick={step ? onStepBack : handleBack} testID={PageLayoutSelectors.backButton}>
            <IconBase Icon={ChevronLeftIcon} className="text-grey-1" />
          </Button>
        )}
      </div>

      {pageTitle && <div className="flex items-center text-center text-base font-semibold truncate">{pageTitle}</div>}

      <div className="flex-1 flex items-center">{headerRightElem}</div>
    </div>
  );
};
