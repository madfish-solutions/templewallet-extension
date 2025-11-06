import React, { FC, ReactElement, ReactNode, memo, useMemo, useCallback } from 'react';

import clsx from 'clsx';
import Modal from 'react-modal';

import { ACTIVATE_CONTENT_FADER_CLASSNAME } from 'app/a11y/content-fader';
import { useIsBrowserFullscreen } from 'app/ConfirmPage/hooks/use-is-browser-fullscreen';
import { useAppEnv } from 'app/env';
import { useToastBottomShiftModalLogic } from 'app/hooks/use-toast-bottom-shift-modal-logic';
import { ReactComponent as ChevronLeftIcon } from 'app/icons/base/chevron_left.svg';
import { ReactComponent as ExIcon } from 'app/icons/base/x.svg';
import { FULL_PAGE_WRAP_OVERLAY_CLASSNAME, LAYOUT_CONTAINER_CLASSNAME } from 'app/layouts/containers';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { TestIDProps } from 'lib/analytics';

import { IconBase } from '../IconBase';
import { SuspenseContainer } from '../SuspenseContainer';

import ModStyles from './styles.module.css';

export { ActionsButtonsBox } from './actions-buttons-box';

export const CLOSE_ANIMATION_TIMEOUT = 300;

interface PageModalProps extends TestIDProps {
  title: ReactChildren;
  opened: boolean;
  headerClassName?: string;
  titleLeft?: ReactNode;
  titleRight?: ReactNode;
  onGoBack?: EmptyFn;
  onRequestClose?: EmptyFn;
  animated?: boolean;
  contentPadding?: boolean;
  miniVersion?: boolean;
  suspenseLoader?: ReactNode;
  suspenseErrorMessage?: string;
  shouldChangeBottomShift?: boolean;
  children: ReactNode | (() => ReactElement);
}

export type ModalHeaderConfig = Pick<PageModalProps, 'title' | 'onGoBack'>;

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
  contentPadding = false,
  shouldChangeBottomShift = true,
  miniVersion = false,
  suspenseLoader,
  suspenseErrorMessage
}) => {
  const { fullPage, confirmWindow } = useAppEnv();
  const testnetModeEnabled = useTestnetModeEnabledSelector();
  const onCloseBottomShiftCallback = useToastBottomShiftModalLogic(opened, shouldChangeBottomShift);
  const isBrowserFullscreen = useIsBrowserFullscreen();

  const baseOverlayClassNames = useMemo(() => {
    if (confirmWindow) return isBrowserFullscreen ? 'pt-13 pb-8' : 'pt-4';

    if (testnetModeEnabled) return fullPage ? 'pt-19 pb-8' : 'pt-10';

    return fullPage ? 'pt-13 pb-8' : 'pt-4';
  }, [confirmWindow, fullPage, testnetModeEnabled, isBrowserFullscreen]);

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
        base: clsx('fixed z-modal-page', baseOverlayClassNames, miniVersion ? 'left-0 right-0 bottom-0' : 'inset-0'),
        afterOpen: '',
        beforeClose: ''
      }}
      className={{
        base: clsx(
          LAYOUT_CONTAINER_CLASSNAME,
          FULL_PAGE_WRAP_OVERLAY_CLASSNAME,
          'h-full flex flex-col bg-white focus:outline-none',
          !miniVersion && 'overflow-hidden',
          fullPage ? 'rounded-lg' : 'rounded-t-lg',
          ModStyles.base,
          animated && 'ease-out duration-300'
        ),
        afterOpen: ModStyles.opened,
        beforeClose: ModStyles.closed
      }}
      appElement={document.getElementById('root')!}
      onRequestClose={onRequestClose}
      testId={testID}
    >
      {!miniVersion && (
        <div className="flex items-center p-4 border-b-0.5 border-lines">
          <div className="w-12">{titleLeft ?? (onGoBack ? <BackButton onClick={handleGoBack} /> : null)}</div>

          <div className={clsx('flex-1 text-center text-font-regular-bold', headerClassName)}>{title}</div>

          <div className="w-12 flex justify-end">{titleRight ?? <CloseButton onClick={onRequestClose} />}</div>
        </div>
      )}

      <div className={clsx('flex-grow flex flex-col', !miniVersion && 'overflow-hidden', contentPadding && 'p-4')}>
        <SuspenseContainer loader={suspenseLoader} errorMessage={suspenseErrorMessage}>
          {typeof children === 'function' ? (opened ? children() : null) : children}
        </SuspenseContainer>
      </div>
    </Modal>
  );
};

const BackButton = memo<{ onClick?: EmptyFn }>(({ onClick }) => (
  <IconBase Icon={ChevronLeftIcon} size={16} className="text-grey-2 cursor-pointer" onClick={onClick} />
));

export const CloseButton = memo<{ onClick?: EmptyFn }>(({ onClick }) => (
  <IconBase Icon={ExIcon} size={16} className="text-grey-2 cursor-pointer" onClick={onClick} />
));
