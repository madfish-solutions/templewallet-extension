import React, { memo, PropsWithChildren, ReactNode, useCallback, useMemo, useRef } from 'react';

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

export const DefaultHeader = memo<PropsWithChildren<DefaultHeaderProps>>(
  ({ children, pageTitle, step, setStep, headerRightElem }) => {
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

    const hasChildren = !!children;

    const rootClassName = useMemo(
      () =>
        clsx(
          HEADER_IS_STICKY && 'sticky z-header -top-px',
          'flex flex-col',
          sticked && 'shadow',
          !sticked && 'rounded-t-inherit',
          !sticked && !hasChildren && 'border-b-0.5 border-lines',
          'ease-in-out duration-300'
        ),
      [sticked, hasChildren]
    );

    return (
      <div ref={rootRef} className={rootClassName}>
        <div
          className={clsx(
            'flex items-center p-4 min-h-14 bg-white overflow-hidden',
            hasChildren && 'border-b-0.5 border-lines'
          )}
        >
          <div className="flex-1 flex items-center">
            <Button className="block" onClick={onBackClick} testID={PageLayoutSelectors.backButton}>
              <IconBase Icon={ChevronLeftIcon} className="text-grey-2" />
            </Button>
          </div>

          {pageTitle && (
            <div className="flex items-center text-center text-font-regular-bold truncate">{pageTitle}</div>
          )}

          <div className="flex-1 flex items-center justify-end">{headerRightElem}</div>
        </div>

        {children}
      </div>
    );
  }
);
