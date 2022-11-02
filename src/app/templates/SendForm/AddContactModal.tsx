import React, { FC, useCallback } from 'react';

import classNames from 'clsx';
import { useForm } from 'react-hook-form';

import { FormField, FormSubmitButton, FormSecondaryButton } from 'app/atoms';
import HashShortView from 'app/atoms/HashShortView';
import Identicon from 'app/atoms/Identicon';
import ModalWithTitle from 'app/templates/ModalWithTitle';
import { T, t } from 'lib/i18n';
import { useContacts } from 'lib/temple/front';
import { withErrorHumanDelay } from 'lib/ui/humanDelay';

type AddContactModalProps = {
  address: string | null;
  onClose: () => void;
};

const AddContactModal: FC<AddContactModalProps> = ({ address, onClose }) => {
  const { addContact } = useContacts();

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
        await withErrorHumanDelay(err, () => setError('address', 'submit-error', err.message));
      }
    },
    [submitting, clearError, addContact, address, resetForm, onClose, setError]
  );

  return (
    <ModalWithTitle isOpen={Boolean(address)} title={<T id="addNewContact" />} onRequestClose={onClose}>
      <form onSubmit={handleSubmit(onAddContactSubmit)}>
        <div className="mb-8">
          <div className="mb-4 flex items-stretch border rounded-md p-2">
            <Identicon type="bottts" hash={address ?? ''} size={32} className="flex-shrink-0 shadow-xs" />

            <div className="ml-3 flex-1 flex items-center">
              <span className={classNames('text-base text-gray-700')}>
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
          <FormSecondaryButton type="button" small className="mr-3" onClick={onClose}>
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
