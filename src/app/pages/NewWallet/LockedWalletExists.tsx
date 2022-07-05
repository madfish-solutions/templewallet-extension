import React, { FC } from 'react';

import { T, t } from '../../../lib/i18n/react';
import { Link } from '../../../lib/woozie';
import Alert from '../../atoms/Alert';

interface LockedWalletExistsProps {
  locked: boolean;
}

export const LockedWalletExists: FC<LockedWalletExistsProps> = ({ locked }) =>
  locked ? (
    <Alert
      title={t('attentionExclamation')}
      description={
        <>
          <p>
            <T id="lockedWalletAlreadyExists" />
          </p>

          <p className="mt-1">
            <T
              id="unlockWalletPrompt"
              substitutions={[
                <T id="backToUnlockPage" key="link">
                  {linkLabel => (
                    <Link to="/" className="font-semibold hover:underline">
                      {linkLabel}
                    </Link>
                  )}
                </T>
              ]}
            />
          </p>
        </>
      }
      className="my-6"
    />
  ) : null;
