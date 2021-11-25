import React, { FC } from 'react';

import classNames from 'clsx';
import CSSTransition from 'react-transition-group/CSSTransition';

import { ReactComponent as LedgerNanoIcon } from 'app/misc/ledger.svg';
import { T } from 'lib/i18n/react';

type ConfirmLedgerOverlayProps = {
  displayed: boolean;
};

const ConfirmLedgerOverlay: FC<ConfirmLedgerOverlayProps> = ({ displayed }) => (
  <CSSTransition
    in={displayed}
    timeout={500}
    classNames={{
      enter: 'opacity-0',
      enterActive: classNames('opacity-100', 'transition ease-out duration-500'),
      exit: classNames('opacity-0', 'transition ease-in duration-500')
    }}
    unmountOnExit
  >
    <div
      className={classNames(
        'absolute inset-0',
        'bg-white bg-opacity-90',
        'p-8',
        'flex flex-col items-center justify-center'
      )}
    >
      <h1 className={classNames('mb-8', 'text-center', 'text-xl font-medium tracking-tight text-gray-600')}>
        <T id="confirmActionOnDevice">{message => <span className="text-base font-normal">{message}</span>}</T>
        <br />
        <T
          id="deviceName"
          substitutions={[
            <T id="ledgerNano" key="ledgerNano">
              {message => <span className="text-gray-700">{message}</span>}
            </T>
          ]}
        />
      </h1>

      <LedgerNanoIcon className="animate-pulse" style={{ width: '10rem', height: 'auto' }} />

      {process.env.TARGET_BROWSER === 'chrome' && (
        <p className={classNames('mt-8', 'text-center', 'text-sm text-gray-600', 'max-w-xs')}>
          <T id="ledgerLiveBridgeGuide" />
        </p>
      )}
    </div>
  </CSSTransition>
);

export default ConfirmLedgerOverlay;
