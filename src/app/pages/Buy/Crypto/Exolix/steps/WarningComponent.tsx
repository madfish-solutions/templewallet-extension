import React, { FC } from 'react';

import classNames from 'clsx';

import { CurrencyToken } from 'app/templates/TopUpInput';
import { T } from 'lib/i18n';

import { EXOLIX_CONTACT_LINK } from '../../../../Market/crypto-exchange/config';
import { getProperNetworkFullName } from '../exolix.util';

interface Props {
  currency?: CurrencyToken;
  amountAttention?: boolean;
}

const WarningComponent: FC<Props> = ({ currency, amountAttention }) => {
  return (
    <>
      {(currency || amountAttention) && (
        <div
          className={classNames(
            'py-2 px-4 rounded-lg border border-orange-500 mt-8',
            currency && 'mt-15 mb-8',
            amountAttention && 'mt-8'
          )}
        >
          <p className={'text-orange-500 text-xs'}>
            {currency && (
              <T id="exolixWarningNote" substitutions={[currency.name, getProperNetworkFullName(currency)]} />
            )}

            {amountAttention && (
              <>
                <span className="text-base block pb-2 pt-2">
                  <T id={'important'} />
                </span>
                <T
                  id={'attentionSendAmount'}
                  substitutions={[
                    <a href={EXOLIX_CONTACT_LINK} className="underline" target="_blank" rel="noreferrer">
                      <T id={'support'} />
                    </a>
                  ]}
                />
              </>
            )}
          </p>
        </div>
      )}
    </>
  );
};

export default WarningComponent;
