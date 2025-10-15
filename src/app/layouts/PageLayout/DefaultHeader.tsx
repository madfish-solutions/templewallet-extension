import React, { memo, PropsWithChildren, ReactNode, useCallback, useMemo, useRef } from 'react';

import clsx from 'clsx';

import { IconBase } from 'app/atoms';
import { Button } from 'app/atoms/Button';
import { useStickyObservation } from 'app/hooks/use-sticky-observation';
import { ReactComponent as ChevronLeftIcon } from 'app/icons/base/chevron_left.svg';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { goBack, HistoryAction, navigate, useLocation } from 'lib/woozie';

import { PageLayoutSelectors } from './selectors';

export interface DefaultHeaderProps {
  pageTitle?: ReactNode;
  step?: number;
  setStep?: SyncFn<number>;
  headerLeftElem?: ReactNode;
  headerRightElem?: ReactNode;
  shouldShowBackButton?: boolean;
}

const HEADER_IS_STICKY = true;

export const DefaultHeader = memo<PropsWithChildren<DefaultHeaderProps>>(
  ({ children, pageTitle, step, setStep, headerLeftElem, headerRightElem, shouldShowBackButton = true }) => {
    const { historyPosition, pathname } = useLocation();

    const inHome = pathname === '/';
    const canNavBack = historyPosition > 0 || !inHome;

    const onBackClick = useCallback(() => {
      if (step && step > 0) return void setStep?.(step - 1);

      if (canNavBack) return void goBack();

      navigate('/', HistoryAction.Replace);
    }, [setStep, step, canNavBack]);

    const elemRef = useRef<HTMLDivElement>(null);

    const testnetModeEnabled = useTestnetModeEnabledSelector();

    const sticked = useStickyObservation(elemRef, HEADER_IS_STICKY);

    const hasChildren = Boolean(children);

    const rootClassName = useMemo(
      () =>
        clsx(
          HEADER_IS_STICKY && 'sticky z-header',
          testnetModeEnabled ? 'top-[23px]' : '-top-px',
          'flex flex-col',
          sticked && 'shadow',
          !sticked && 'rounded-t-inherit',
          !sticked && !hasChildren && 'border-b-0.5 border-lines',
          'ease-in-out duration-300'
        ),
      [testnetModeEnabled, sticked, hasChildren]
    );

    return (
      <div ref={elemRef} className={rootClassName}>
        <div
          className={clsx(
            'flex items-center p-4 min-h-14 bg-white overflow-hidden',
            hasChildren && 'border-b-0.5 border-lines'
          )}
        >
          <div className="flex-1 flex items-center">
            {headerLeftElem ?? shouldShowBackButton ? (
              <Button className="block" onClick={onBackClick} testID={PageLayoutSelectors.backButton}>
                <IconBase Icon={ChevronLeftIcon} className="text-grey-2" />
              </Button>
            ) : null}
          </div>

          {pageTitle && (
            <div className="flex items-center text-center text-font-regular-bold truncate max-w-64">{pageTitle}</div>
          )}

          <div className="flex-1 flex items-center justify-end">{headerRightElem}</div>
        </div>

        {children}
      </div>
    );
  }
);
