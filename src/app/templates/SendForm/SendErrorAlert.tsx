import React, { memo } from 'react';

import { HttpResponseError } from '@taquito/http-utils';

import { Alert } from 'app/atoms';
import { NotEnoughFundsError, ZeroBalanceError, ZeroTEZBalanceError } from 'app/defaults';
import { useGasToken } from 'lib/assets/hooks';
import { T, t } from 'lib/i18n';

interface Props {
  type: 'submit' | 'estimation';
  error: unknown;
}

const SendErrorAlert = memo<Props>(({ type, error }) => {
  const { symbol } = useGasToken();

  return (
    <Alert
      type={type === 'submit' ? 'error' : 'warning'}
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

          case isCounterError(error):
            return t('counterIsOffOperationError');

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
});

export default SendErrorAlert;

const isCounterError = (error: unknown) =>
  error instanceof HttpResponseError && error.message.includes('counter_in_the_');
