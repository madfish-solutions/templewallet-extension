import React, { memo, ReactNode, useCallback, useMemo, useRef } from 'react';

import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import { Button } from 'app/atoms/Button';
import { ReactComponent as ChevronLeftIcon } from 'app/icons/base/chevron_left.svg';
import { goBack, HistoryAction, navigate, useLocation } from 'lib/woozie';

import { useStickyObservation } from '../containers';

import { PageLayoutSelectors } from './selectors';

export interface DefaultHeaderProps {
  pageTitle?: ReactNode;
  step?: number;
  setStep?: (step: number) => void;
  headerRightElem?: React.ReactNode;
}

const HEADER_IS_STICKY = true;

export const DefaultHeader = memo<DefaultHeaderProps>(({ pageTitle, step, setStep, headerRightElem }) => {
  const { historyPosition, pathname } = useLocation();

  const inHome = pathname === '/';
  const canNavBack = historyPosition > 0 || !inHome;

  const onBackClick = useCallback(() => {
    if (step && step > 0) return void setStep?.(step - 1);

    if (canNavBack) return void goBack();

    navigate('/', HistoryAction.Replace);
  }, [setStep, step, canNavBack]);

  const rootRef = useRef<HTMLDivElement>(null);

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
        <Button className="block" onClick={onBackClick} testID={PageLayoutSelectors.backButton}>
          <IconBase Icon={ChevronLeftIcon} className="text-grey-1" />
        </Button>
      </div>

      {pageTitle && <div className="flex items-center text-center text-font-medium-bold truncate">{pageTitle}</div>}

      <div className="flex-1 flex items-center justify-end">{headerRightElem}</div>
    </div>
  );
});
