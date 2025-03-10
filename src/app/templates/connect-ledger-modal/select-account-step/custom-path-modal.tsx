import React, { memo, useCallback } from 'react';

import { Controller, useForm } from 'react-hook-form-v7';

import { FormField } from 'app/atoms';
import {
  ActionModal,
  ActionModalBodyContainer,
  ActionModalButton,
  ActionModalButtonsContainer
} from 'app/atoms/action-modal';
import { T, t } from 'lib/i18n';
import { shouldDisableSubmitButton } from 'lib/ui/should-disable-submit-button';

import { ConnectLedgerModalSelectors } from '../selectors';

export interface CustomPathFormData {
  index: string;
}

interface CustomPathModalProps {
  alreadyInWalletIndexes: number[];
  alreadyInTmpListIndexes: number[];
  onClose: SyncFn<void>;
  onSubmit: (formData: CustomPathFormData) => Promise<void>;
}

export const CustomPathModal = memo<CustomPathModalProps>(
  ({ alreadyInWalletIndexes, alreadyInTmpListIndexes, onClose, onSubmit }) => {
    const { control, handleSubmit, formState } = useForm<CustomPathFormData>();
    const { errors } = formState;

    const validateIndex = useCallback(
      (rawIndex: string) => {
        const parsedIndex = parseInt(rawIndex, 10);

        if (!Number.isInteger(parsedIndex) || parsedIndex < 0) {
          return t('invalidIndexError');
        }

        if (alreadyInWalletIndexes.includes(parsedIndex)) {
          return t('accountAlreadyImported');
        }

        if (alreadyInTmpListIndexes.includes(parsedIndex)) {
          return t('accountAlreadyListed');
        }

        return true;
      },
      [alreadyInTmpListIndexes, alreadyInWalletIndexes]
    );

    return (
      <ActionModal title={<T id="customPath" />} onClose={onClose}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ActionModalBodyContainer>
            <Controller
              name="index"
              control={control}
              rules={{
                required: t('required'),
                validate: validateIndex
              }}
              render={({ field }) => (
                <FormField
                  {...field}
                  label={t('accountIndex')}
                  labelDescription={t('accountIndexDescription')}
                  id="index-input"
                  type="text"
                  placeholder="0"
                  errorCaption={errors.index?.message}
                  reserveSpaceForError={false}
                  containerClassName="mb-1"
                  testID={ConnectLedgerModalSelectors.accountIndexInput}
                />
              )}
            />
          </ActionModalBodyContainer>
          <ActionModalButtonsContainer>
            <ActionModalButton
              color="primary"
              disabled={shouldDisableSubmitButton({ errors, formState })}
              type="submit"
              testID={ConnectLedgerModalSelectors.addCustomPathButton}
            >
              <T id="add" />
            </ActionModalButton>
          </ActionModalButtonsContainer>
        </form>
      </ActionModal>
    );
  }
);
