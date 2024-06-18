import React, { FC, useCallback } from 'react';

import { useForm } from 'react-hook-form';

import { FormField, FormSubmitButton, FormSecondaryButton } from 'app/atoms';
import { AccountAvatar } from 'app/atoms/AccountAvatar';
import HashShortView from 'app/atoms/HashShortView';
import ModalWithTitle from 'app/templates/ModalWithTitle';
import { T, t } from 'lib/i18n';
import { useContactsActions } from 'lib/temple/front';
import { delay } from 'lib/utils';

type AddContactModalProps = {
  address: string | null;
  onClose: () => void;
};

const AddContactModal: FC<AddContactModalProps> = ({ address, onClose }) => {
  const { addContact } = useContactsActions();

  const {
    register,
    reset: resetForm,
    handleSubmit,
    formState,
    clearError,
    setError,
    errors
  } = useForm<{ name: string }>();
  const submitting = formState.isSubmitting;

  const onAddContactSubmit = useCallback(
    async ({ name }: { name: string }) => {
      if (submitting) return;

      try {
        clearError();

        await addContact({
          address: address!,
          name,
          addedAt: Date.now()
        });
        resetForm();
        onClose();
      } catch (err: any) {
        console.error(err);

        await delay();

        setError('address', 'submit-error', err.message);
      }
    },
    [submitting, clearError, addContact, address, resetForm, onClose, setError]
  );

  return (
    <ModalWithTitle isOpen={Boolean(address)} title={<T id="addNewContact" />} onRequestClose={onClose}>
      <form onSubmit={handleSubmit(onAddContactSubmit)}>
        <div className="mb-8">
          <div className="mb-4 flex items-stretch border rounded-md p-2">
            <AccountAvatar seed={address ?? ''} size={32} className="flex-shrink-0" />

            <div className="ml-3 flex-1 flex items-center">
              <span className="text-base text-gray-700">
                <HashShortView hash={address ?? ''} />
              </span>
            </div>
          </div>

          <FormField
            ref={register({
              required: t('required'),
              maxLength: { value: 50, message: t('maximalAmount', '50') }
            })}
            label={t('name')}
            id="name"
            name="name"
            placeholder={t('newContactPlaceholder')}
            errorCaption={errors.name?.message}
            containerClassName="mb-6"
            maxLength={50}
          />
        </div>

        <div className="flex justify-end">
          <FormSecondaryButton small className="mr-3" onClick={onClose}>
            <T id="cancel" />
          </FormSecondaryButton>

          <FormSubmitButton small loading={submitting}>
            <T id="addContact" />
          </FormSubmitButton>
        </div>
      </form>
    </ModalWithTitle>
  );
};

export default AddContactModal;
