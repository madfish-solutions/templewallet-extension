import React, { FC, useMemo } from 'react';

import clsx from 'clsx';
import Modal from 'react-modal';

import { ACTIVATE_CONTENT_FADER_CLASSNAME } from 'app/a11y/content-fader';
import { useIsBrowserFullscreen } from 'app/ConfirmPage/hooks/use-is-browser-fullscreen';
import { useAppEnv } from 'app/env';
import { FULL_PAGE_WRAP_OVERLAY_CLASSNAME, LAYOUT_CONTAINER_CLASSNAME } from 'app/layouts/containers';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { TestIDProps } from 'lib/analytics';

import ModStyles from './styles.module.css';

import { CLOSE_ANIMATION_TIMEOUT, CloseButton } from './index';

interface MiniPageModalProps extends PropsWithChildren, TestIDProps {
  opened: boolean;
  title?: ReactChildren;
  onRequestClose?: EmptyFn;
  contentPadding?: boolean;
  showHeader?: boolean;
}

export const MiniPageModal: FC<MiniPageModalProps> = ({
  title,
  opened,
  onRequestClose,
  showHeader = true,
  children,
  testID
}) => {
  const { fullPage, confirmWindow } = useAppEnv();
  const testnetModeEnabled = useTestnetModeEnabledSelector();
  const isBrowserFullscreen = useIsBrowserFullscreen();

  const baseOverlayClassNames = useMemo(() => {
    if (confirmWindow) return isBrowserFullscreen ? 'pt-13 pb-8' : 'pt-4';

    if (testnetModeEnabled) return fullPage ? 'pt-19 pb-8' : 'pt-10';

    return fullPage ? 'pt-13 pb-8' : 'pt-4';
  }, [confirmWindow, fullPage, testnetModeEnabled, isBrowserFullscreen]);

  return (
    <Modal
      isOpen={opened}
      closeTimeoutMS={CLOSE_ANIMATION_TIMEOUT}
      htmlOpenClassName="overflow-hidden" // Disabling page scroll and/or bounce behind modal
      bodyOpenClassName={ACTIVATE_CONTENT_FADER_CLASSNAME}
      overlayClassName={{
        base: clsx('fixed z-modal-page left-0 right-0 bottom-0', baseOverlayClassNames),
        afterOpen: '',
        beforeClose: ''
      }}
      className={{
        base: clsx(
          LAYOUT_CONTAINER_CLASSNAME,
          FULL_PAGE_WRAP_OVERLAY_CLASSNAME,
          'h-full flex flex-col bg-white focus:outline-none',
          fullPage ? 'rounded-8' : 'rounded-t-8',
          ModStyles.base,
          'ease-out duration-300'
        ),
        afterOpen: ModStyles.opened,
        beforeClose: ModStyles.closed
      }}
      appElement={document.getElementById('root')!}
      onRequestClose={onRequestClose}
      testId={testID}
    >
      {showHeader && (
        <div className="flex items-center border-b-0.5 border-lines p-3">
          <div className="w-12" />

          <div className="flex-1 text-center text-font-regular-bold">{title}</div>

          <div className="w-12 flex justify-end">
            <CloseButton onClick={onRequestClose} />
          </div>
        </div>
      )}

      <div className="flex-grow flex flex-col">{children}</div>
    </Modal>
  );
};
