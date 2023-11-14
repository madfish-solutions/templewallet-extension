import React, { FC } from 'react';

import classNames from 'clsx';

import { ReactComponent as CopyIcon } from 'app/icons/copy.svg';

import { setTestID } from '../../../lib/analytics';
import { T, t } from '../../../lib/i18n';
import useCopyToClipboard from '../../../lib/ui/useCopyToClipboard';
import { FormField } from '../../atoms';
import Spinner from '../../atoms/Spinner/Spinner';
import { ReceiveSelectors } from '../Receive/Receive.selectors';

interface Props {
  address?: string;
}

export const ReceiveTab: FC<Props> = ({ address }) => {
  const { fieldRef, copy, copied } = useCopyToClipboard();

  if (!address) {
    return (
      <div className="flex items-center justify-center">
        <div>
          <Spinner theme="gray" className="w-20" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto mt-4">
      <FormField
        ref={fieldRef}
        textarea
        rows={2}
        id="receive-address"
        label={t('address')}
        labelDescription={t('accountAddressLabel')}
        value={address}
        size={36}
        spellCheck={false}
        readOnly
        style={{
          resize: 'none'
        }}
      />

      <button
        type="button"
        className={classNames(
          'flex items-center justify-center mx-auto mb-6 py-1 px-2 w-40',
          'border rounded border-primary-orange bg-primary-orange shadow-sm',
          'text-sm font-semibold text-primary-orange-lighter text-shadow-black-orange',
          'opacity-90 hover:opacity-100 focus:opacity-100 hover:shadow focus:shadow',
          'transition duration-300 ease-in-out'
        )}
        onClick={copy}
        {...setTestID(ReceiveSelectors.copyToClipboardButton)}
      >
        {copied ? (
          <T id="copiedAddress" />
        ) : (
          <>
            <CopyIcon className="mr-1 h-4 w-auto stroke-current stroke-2" />
            <T id="copyAddressToClipboard" />
          </>
        )}
      </button>
    </div>
  );
};
