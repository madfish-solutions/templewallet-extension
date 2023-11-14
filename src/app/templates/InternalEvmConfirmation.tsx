import React, { FC, useCallback } from 'react';

import classNames from 'clsx';

import { FormSubmitButton, FormSecondaryButton } from 'app/atoms';
import Logo from 'app/atoms/Logo';
import SubTitle from 'app/atoms/SubTitle';
import { useAppEnv } from 'app/env';
import { T, t } from 'lib/i18n';
import { TempleEvmOpsConfirmationPayload } from 'lib/temple/types';

import { useSafeState } from '../../lib/ui/hooks';
import { delay } from '../../lib/utils';
import NetworkBanner from './NetworkBanner';

interface Props {
  payload: TempleEvmOpsConfirmationPayload;
  onConfirm: (confirmed: boolean) => Promise<void>;
  error?: any;
}

export const InternalEvmConfirmation: FC<Props> = ({ payload, onConfirm }) => {
  const { popup } = useAppEnv();

  const [confirming, setConfirming] = useSafeState(false);
  const [declining, setDeclining] = useSafeState(false);

  const confirm = useCallback(
    async (confirmed: boolean) => {
      try {
        await onConfirm(confirmed);
      } catch (err: any) {
        // Human delay.
        await delay();
      }
    },
    [onConfirm]
  );

  const handleDeclineClick = useCallback(async () => {
    if (confirming || declining) return;

    setDeclining(true);
    await confirm(false);
    setDeclining(false);
  }, [confirming, declining, setDeclining, confirm]);

  const handleConfirmClick = useCallback(async () => {
    if (confirming || declining) return;

    setConfirming(true);
    await confirm(true);
    setConfirming(false);
  }, [confirming, declining, setConfirming, confirm]);

  return (
    <div className={classNames('h-full w-full max-w-sm mx-auto flex flex-col', !popup && 'justify-center px-2')}>
      <div className={classNames('flex flex-col items-center justify-center', popup && 'flex-1')}>
        <div className="flex items-center my-4">
          <Logo hasTitle />
        </div>
      </div>

      <div
        className={classNames(
          'flex flex-col relative bg-white shadow-md overflow-y-auto',
          popup ? 'border-t border-gray-200' : 'rounded-md'
        )}
        style={{ height: '34rem' }}
      >
        <div className="px-4 pt-3">
          <SubTitle small className="mb-4">
            <T id="confirmAction" substitutions={t('operations')} />
          </SubTitle>

          <NetworkBanner rpc={payload.networkRpc} />
        </div>

        <div className="flex-1" />

        <div className="sticky bottom-0 w-full bg-white shadow-md flex items-stretch px-4 pt-2 pb-4">
          <div className="w-1/2 pr-2">
            <FormSecondaryButton
              type="button"
              className="w-full"
              loading={declining}
              disabled={declining}
              onClick={handleDeclineClick}
            >
              <T id="decline" />
            </FormSecondaryButton>
          </div>

          <div className="w-1/2 pl-2">
            <FormSubmitButton type="button" className="justify-center w-full" onClick={handleConfirmClick}>
              <T id="confirm" />
            </FormSubmitButton>
          </div>
        </div>
      </div>
    </div>
  );
};
