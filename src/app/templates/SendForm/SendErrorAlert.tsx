import React, { FC } from 'react';

import { Alert } from 'app/atoms';
import { NotEnoughFundsError, ZeroBalanceError, ZeroTEZBalanceError } from 'app/defaults';
import { T, t } from 'lib/i18n';
import { useGasToken } from 'lib/temple/front';

type SendErrorAlertProps = {
  type: 'submit' | 'estimation';
  error: unknown;
};

const SendErrorAlert: FC<SendErrorAlertProps> = ({ type, error }) => {
  const { symbol } = useGasToken();

  return (
    <Alert
      type={type === 'submit' ? 'error' : 'warn'}
      title={(() => {
        switch (true) {
          case error instanceof ZeroTEZBalanceError:
            return `${t('notEnoughCurrencyFunds', 'ꜩ')} 😶`;

          case error instanceof NotEnoughFundsError:
            return `${t('notEnoughFunds')} 😶`;

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
                  <li>
                    <T id="minimalFeeGreaterThanBalanceVerbose" substitutions={symbol} />
                  </li>
                  <li>
                    <T id="networkOrOtherIssue" />
                  </li>
                </ul>
              </>
            );
        }
      })()}
      autoFocus
      className="mt-6 mb-4"
    />
  );
};

export default SendErrorAlert;
