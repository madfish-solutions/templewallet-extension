import React, { FC, useCallback } from 'react';

import { Controller } from 'react-hook-form-v7';

import { CaptionAlert, FormField } from 'app/atoms';
import { ActionsButtonsBox } from 'app/atoms/PageModal/actions-buttons-box';
import { StyledButton } from 'app/atoms/StyledButton';
import { useTempleBackendActionForm } from 'app/hooks/use-temple-backend-action-form';
import { DEFAULT_PASSWORD_INPUT_PLACEHOLDER } from 'lib/constants';
import { t } from 'lib/i18n';
import { useTempleClient } from 'lib/temple/front';
import { useVanishingState } from 'lib/ui/hooks';

import { TempleAccountType } from '../../../lib/temple/types';
import { useAccount } from '../../../temple/front';
import { DeadEndBoundaryError } from '../../ErrorBoundary';

import { QrCodeModal } from './QrCodeModal';
import { SyncSettingsSelectors } from './SyncSettings.selectors';

interface FormData {
  password: string;
}

const defaultFormValues: FormData = {
  password: ''
};

const SyncSettings: FC = () => {
  const account = useAccount();

  if (account.type !== TempleAccountType.HD) throw new DeadEndBoundaryError();

  const { generateSyncPayload } = useTempleClient();

  const [payload, setPayload] = useVanishingState();

  const setQrCodePayload = useCallback(
    async ({ password }: FormData) => {
      const syncPayload = await generateSyncPayload(password, account.walletId);
      setPayload(syncPayload);
    },
    [account.walletId, generateSyncPayload, setPayload]
  );

  const { control, handleSubmit, formState, onSubmit } = useTempleBackendActionForm<FormData>(
    setQrCodePayload,
    'password',
    {
      mode: 'onSubmit',
      defaultValues: defaultFormValues
    }
  );

  const { errors, isSubmitting, isValid, submitCount } = formState;

  const formSubmitted = submitCount > 0;

  const resetPayload = useCallback(() => void setPayload(null), [setPayload]);

  return (
    <>
      <div className="flex-1">
        <CaptionAlert type="info" title={t('syncSettingsTitle')} message={t('syncSettingsDescription')} />

        <form id="sync-form" onSubmit={handleSubmit(onSubmit)}>
          <Controller
            name="password"
            control={control}
            rules={{ required: t('required') }}
            render={({ field }) => (
              <FormField
                {...field}
                autoFocus
                type="password"
                id="reveal-secret-password"
                label={t('syncSettingsPassword')}
                placeholder={DEFAULT_PASSWORD_INPUT_PLACEHOLDER}
                errorCaption={errors.password?.message}
                testID={SyncSettingsSelectors.passwordInput}
                containerClassName="mt-6"
              />
            )}
          />
        </form>
      </div>

      <ActionsButtonsBox flexDirection="col" className="px-0" style={{ backgroundColor: '#FBFBFB' }}>
        <StyledButton
          type="submit"
          form="sync-form"
          size="L"
          color="primary"
          loading={isSubmitting}
          disabled={formSubmitted && !isValid}
          testID={SyncSettingsSelectors.syncButton}
        >
          Sync
        </StyledButton>
      </ActionsButtonsBox>

      {payload && <QrCodeModal onClose={resetPayload} payload={payload} />}
    </>
  );
};

export default SyncSettings;
