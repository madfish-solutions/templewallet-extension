import React, { FC } from 'react';

import classNames from 'clsx';

import Alert from 'app/atoms/Alert';
import { NotEnoughFundsError, ZeroBalanceError, ZeroTEZBalanceError } from 'app/defaults';
import { T, t } from 'lib/i18n/react';

type SendErrorAlertProps = {
  type: 'submit' | 'estimation';
  error: Error;
};

const SendErrorAlert: FC<SendErrorAlertProps> = ({ type, error }) => (
  <Alert
    type={type === 'submit' ? 'error' : 'warn'}
    title={(() => {
      switch (true) {
        case error instanceof NotEnoughFundsError:
          return error instanceof ZeroTEZBalanceError
            ? `${t('notEnoughCurrencyFunds', 'ꜩ')} 😶`
            : `${t('notEnoughFunds')} 😶`;

        default:
          return t('failed');
      }
    })()}
    description={(() => {
      switch (true) {
        case error instanceof ZeroBalanceError:
          return t('yourBalanceIsZero');

        case error instanceof ZeroTEZBalanceError:
          return t('mainAssetBalanceIsZero');

        case error instanceof NotEnoughFundsError:
          return t('minimalFeeGreaterThanBalanceVerbose');

        default:
          return (
            <>
              <T id={type === 'submit' ? 'unableToSendTransactionAction' : 'unableToEstimateTransactionAction'} />
              <br />
              <T id="thisMayHappenBecause" />
              <ul className="mt-1 ml-2 text-xs list-disc list-inside">
                <T id="minimalFeeGreaterThanBalanceVerbose">{message => <li>{message}</li>}</T>
                <T id="networkOrOtherIssue">{message => <li>{message}</li>}</T>
              </ul>
            </>
          );
      }
    })()}
    autoFocus
    className={classNames('mt-6 mb-4')}
  />
);

export default SendErrorAlert;
