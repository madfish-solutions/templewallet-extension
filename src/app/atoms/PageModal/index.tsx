import React, { FC, ReactElement, ReactNode, memo, useMemo, useCallback } from 'react';

import clsx from 'clsx';
import Modal from 'react-modal';

import { ACTIVATE_CONTENT_FADER_CLASSNAME } from 'app/a11y/content-fader';
import { useAppEnv } from 'app/env';
import { useToastBottomShiftModalLogic } from 'app/hooks/use-toast-bottom-shift-modal-logic';
import { ReactComponent as ChevronLeftIcon } from 'app/icons/base/chevron_left.svg';
import { ReactComponent as ExIcon } from 'app/icons/base/x.svg';
import { LAYOUT_CONTAINER_CLASSNAME } from 'app/layouts/containers';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { TestIDProps } from 'lib/analytics';

import { IconBase } from '../IconBase';
import { SuspenseContainer } from '../SuspenseContainer';

import ModStyles from './styles.module.css';

export { ActionsButtonsBox } from './actions-buttons-box';

export const CLOSE_ANIMATION_TIMEOUT = 300;

export interface PageModalProps extends TestIDProps {
  title: ReactNode | ReactNode[];
  opened: boolean;
  headerClassName?: string;
  titleLeft?: ReactNode;
  titleRight?: ReactNode;
  onGoBack?: EmptyFn;
  onRequestClose?: EmptyFn;
  animated?: boolean;
  contentPadding?: boolean;
  children: ReactNode | (() => ReactElement);
}

export const PageModal: FC<PageModalProps> = ({
  title,
  opened,
  headerClassName,
  titleLeft,
  onGoBack,
  onRequestClose,
  titleRight,
  children,
  testID,
  animated = true,
  contentPadding = false
}) => {
  const { fullPage, confirmWindow } = useAppEnv();
  const testnetModeEnabled = useTestnetModeEnabledSelector();
  const onCloseBottomShiftCallback = useToastBottomShiftModalLogic(opened);

  const baseOverlayClassNames = useMemo(() => {
    if (confirmWindow) return 'pt-4';

    if (testnetModeEnabled) return fullPage ? 'pt-19 pb-8' : 'pt-10';

    return fullPage ? 'pt-13 pb-8' : 'pt-4';
  }, [confirmWindow, fullPage, testnetModeEnabled]);

  const handleClose = useCallback(() => {
    onCloseBottomShiftCallback();
    onRequestClose?.();
  }, [onCloseBottomShiftCallback, onRequestClose]);

  const handleGoBack = useCallback(() => {
    onCloseBottomShiftCallback();
    onGoBack?.();
  }, [onCloseBottomShiftCallback, onGoBack]);

  return (
    <Modal
      isOpen={opened}
      closeTimeoutMS={animated ? CLOSE_ANIMATION_TIMEOUT : undefined}
      htmlOpenClassName="overflow-hidden" // Disabling page scroll and/or bounce behind modal
      bodyOpenClassName={ACTIVATE_CONTENT_FADER_CLASSNAME}
      overlayClassName={{
        base: clsx('fixed z-modal-page inset-0', baseOverlayClassNames),
        afterOpen: '',
        beforeClose: ''
      }}
      className={{
        base: clsx(
          LAYOUT_CONTAINER_CLASSNAME,
          'h-full flex flex-col bg-white overflow-hidden focus:outline-none',
          fullPage ? 'rounded-lg' : 'rounded-t-lg',
          ModStyles.base,
          animated && 'ease-out duration-300'
        ),
        afterOpen: ModStyles.opened,
        beforeClose: ModStyles.closed
      }}
      appElement={document.getElementById('root')!}
      onRequestClose={handleClose}
      testId={testID}
    >
      <div className="flex items-center p-4 border-b-0.5 border-lines">
        <div className="w-12">{titleLeft ?? onGoBack ? <BackButton onClick={handleGoBack} /> : undefined}</div>

        <div className={clsx('flex-1 text-center text-font-regular-bold', headerClassName)}>{title}</div>

        <div className="w-12 flex justify-end">{titleRight ?? <CloseButton onClick={handleClose} />}</div>
      </div>

      <div className={clsx('flex-grow flex flex-col overflow-hidden', contentPadding && 'p-4')}>
        <SuspenseContainer>
          {typeof children === 'function' ? (opened ? children() : null) : children}
        </SuspenseContainer>
      </div>
    </Modal>
  );
};

export const BackButton = memo<{ onClick?: EmptyFn }>(({ onClick }) => (
  <IconBase Icon={ChevronLeftIcon} size={16} className="text-grey-2 cursor-pointer" onClick={onClick} />
));

export const CloseButton = memo<{ onClick?: EmptyFn }>(({ onClick }) => (
  <IconBase Icon={ExIcon} size={16} className="text-grey-2 cursor-pointer" onClick={onClick} />
));
