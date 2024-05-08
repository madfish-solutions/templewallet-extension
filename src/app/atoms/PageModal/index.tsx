import React, { PropsWithChildren, memo, useCallback, useRef, useState } from 'react';

import clsx from 'clsx';
import Modal from 'react-modal';
import CSSTransition from 'react-transition-group/CSSTransition';

import { ACTIVATE_CONTENT_FADER_CLASSNAME } from 'app/a11y/ContentFader';
import { CONTENT_CONTAINER_CLASSNAME } from 'app/layouts/ContentContainer';

import ModStyles from './styles.module.css';

export const usePageModalState = () => {
  const [opened, setActive] = useState(false);

  const close = useCallback(() => {}, []);

  return { opened, close };
};

interface Props {
  title: string;
  opened: boolean;
  onRequestClose: EmptyFn;
}

export const PageModal = memo<PropsWithChildren<Props>>(({ title, opened, onRequestClose, children }) => {
  return (
    <Modal
      isOpen={opened}
      closeTimeoutMS={300}
      overlayClassName={{
        base: 'fixed z-20 inset-0 pt-13 pb-8',
        afterOpen: '',
        beforeClose: ''
      }}
      className={{
        base: clsx(
          CONTENT_CONTAINER_CLASSNAME,
          'h-full flex flex-col bg-white rounded-lg',
          ModStyles.base,
          'ease-out duration-300'
        ),
        afterOpen: ModStyles.opened,
        beforeClose: ModStyles.closed
      }}
      bodyOpenClassName={ACTIVATE_CONTENT_FADER_CLASSNAME}
      htmlOpenClassName="overflow-hidden"
      // portalClassName={undefined}
      // overlayClassName="fixed inset-0 bg-[#00000026]"
      appElement={document.getElementById('root')!}
      onRequestClose={onRequestClose}
    >
      {/* <PageModalContent active={active}>{children}</PageModalContent> */}
      <div className="p-4 text-center text-sm leading-5 font-semibold border-b border-lines">{title}</div>

      <div className="p-4">{children}</div>
    </Modal>
  );
});

interface PageModalContentProps {
  active: boolean;
}

const PageModalContent = memo<PropsWithChildren<PageModalContentProps>>(({ active, children }) => {
  // Recommended: https://reactcommunity.org/react-transition-group/transition#Transition-prop-nodeRef
  const nodeRef = useRef<HTMLDivElement | null>(null);

  // return (
  //   <Modal isOpen={active} className={'ease-out duration-300'}>
  //     {children}
  //   </Modal>
  // );

  return (
    <CSSTransition
      nodeRef={nodeRef}
      // key={key}
      in={active}
      timeout={10000}
      classNames={{
        enter: clsx('translate-y-full'),
        enterActive: clsx('!translate-y-0', 'ease-out duration-10000'),
        exit: clsx('translate-y-full', 'ease-in duration-10000')
      }}
      mountOnEnter
      unmountOnExit
    >
      <div ref={nodeRef} className={clsx(CONTENT_CONTAINER_CLASSNAME, 'h-full mt-4 bg-white rounded-t-lg')}>
        {children}
      </div>
    </CSSTransition>
  );
});
