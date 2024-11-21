import React, { FC, PropsWithChildren, ReactNode, useMemo } from 'react';

import clsx from 'clsx';
import Modal from 'react-modal';

import { ACTIVATE_CONTENT_FADER_CLASSNAME } from 'app/a11y/ContentFader';
import { useAppEnv } from 'app/env';
import { ReactComponent as ChevronLeftIcon } from 'app/icons/base/chevron_left.svg';
import { ReactComponent as ExIcon } from 'app/icons/base/x.svg';
import { LAYOUT_CONTAINER_CLASSNAME } from 'app/layouts/containers';
import { useTestnetModeEnabledSelector } from 'app/store/settings/selectors';
import { TestIDProps } from 'lib/analytics';

import { IconBase } from '../IconBase';

import ModStyles from './styles.module.css';

export const CLOSE_ANIMATION_TIMEOUT = 300;

interface Props extends TestIDProps {
  title: ReactNode | ReactNode[];
  opened: boolean;
  headerClassName?: string;
  shouldShowBackButton?: boolean;
  shouldShowCloseButton?: boolean;
  onRequestClose?: EmptyFn;
  onGoBack?: EmptyFn;
  animated?: boolean;
}

export const PageModal: FC<PropsWithChildren<Props>> = ({
  title,
  opened,
  headerClassName,
  shouldShowBackButton,
  shouldShowCloseButton = true,
  onRequestClose,
  onGoBack,
  children,
  testID,
  animated = true
}) => {
  const { fullPage } = useAppEnv();
  const testnetModeEnabled = useTestnetModeEnabledSelector();

  const baseOverlayClassNames = useMemo(() => {
    if (testnetModeEnabled) return fullPage ? 'pt-19 pb-8' : 'pt-10';

    return fullPage ? 'pt-13 pb-8' : 'pt-4';
  }, [fullPage, testnetModeEnabled]);

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
          'h-full flex flex-col bg-white overflow-hidden',
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
      <div className="flex items-center p-4 border-b border-lines">
        <div className="w-12">
          {shouldShowBackButton && (
            <IconBase Icon={ChevronLeftIcon} size={16} className="text-grey-2 cursor-pointer" onClick={onGoBack} />
          )}
        </div>

        <div className={clsx('flex-1 text-center text-font-regular-bold', headerClassName)}>{title}</div>

        <div className="w-12 flex justify-end">
          {shouldShowCloseButton && (
            <IconBase Icon={ExIcon} size={16} className="text-grey-2 cursor-pointer" onClick={onRequestClose} />
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
    </Modal>
  );
};
