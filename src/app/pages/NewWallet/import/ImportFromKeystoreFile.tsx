import React, { FC, useCallback, useState } from 'react';

import classNames from 'clsx';
import { Controller, FieldError, NestDataObject, useForm } from 'react-hook-form';

import PasswordStrengthIndicator, { PasswordValidation } from 'lib/ui/PasswordStrengthIndicator';

import { T, t } from '../../../../lib/i18n/react';
import { decryptKukaiSeedPhrase } from '../../../../lib/temple/front';
import { AlertFn, useAlert } from '../../../../lib/ui/dialog';
import FileInput, { FileInputProps } from '../../../atoms/FileInput';
import FormField, { PASSWORD_ERROR_CAPTION } from '../../../atoms/FormField';
import FormSubmitButton from '../../../atoms/FormSubmitButton';
import {
  lettersNumbersMixtureRegx,
  PASSWORD_PATTERN,
  specialCharacterRegx,
  uppercaseLowercaseMixtureRegx
} from '../../../defaults';
import { ReactComponent as TrashbinIcon } from '../../../icons/bin.svg';
import { ReactComponent as PaperclipIcon } from '../../../icons/paperclip.svg';
import { MIN_PASSWORD_LENGTH } from '../SetWalletPassword';

interface FormData {
  keystoreFile?: FileList;
  keystorePassword?: string;
}

const validateKeystoreFile = (value?: FileList) => {
  const file = value?.item(0);

  if (file && !file.name.endsWith('.tez')) {
    return t('selectedFileFormatNotSupported');
  }
  return true;
};

interface ImportFromKeystoreFileProps {
  setSeedPhrase: (seed: string) => void;
  setKeystorePassword: (password: string) => void;
  setIsSeedEntered: (value: boolean) => void;
}

export const ImportFromKeystoreFile: FC<ImportFromKeystoreFileProps> = ({
  setSeedPhrase,
  setKeystorePassword,
  setIsSeedEntered
}) => {
  const customAlert = useAlert();
  const [focusedKeystore, setFocusedKeystore] = useState(false);

  const { setValue, control, register, handleSubmit, errors, triggerValidation, formState } = useForm<FormData>({
    mode: 'onChange'
  });
  const submitting = formState.isSubmitting;

  const isKeystorePasswordError = errors.keystorePassword?.message === PASSWORD_ERROR_CAPTION;

  const [passwordValidationKeystore, setPasswordValidationKeystore] = useState<PasswordValidation>({
    minChar: false,
    cases: false,
    number: false,
    specialChar: false
  });

  const handlePasswordChangeKeystore = (
    e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const tempValue = e.target.value;
    setPasswordValidationKeystore({
      minChar: tempValue.length >= MIN_PASSWORD_LENGTH,
      cases: uppercaseLowercaseMixtureRegx.test(tempValue),
      number: lettersNumbersMixtureRegx.test(tempValue),
      specialChar: specialCharacterRegx.test(tempValue)
    });
  };

  const clearKeystoreFileInput = (event: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    event.stopPropagation();
    setValue('keystoreFile', undefined);
    triggerValidation('keystoreFile');
  };

  const onSubmit = useCallback(
    async (data: FormData) => {
      if (submitting) return;
      try {
        const mnemonic = await decryptKukaiSeedPhrase(await data.keystoreFile!.item(0)!.text(), data.keystorePassword!);
        setSeedPhrase(mnemonic);
        setKeystorePassword(data.keystorePassword!);
        setIsSeedEntered(true);
      } catch (err: any) {
        handleKukaiWalletError(err, customAlert);
      }
    },
    [setSeedPhrase, setKeystorePassword, setIsSeedEntered, submitting, customAlert]
  );

  return (
    <form className="w-full max-w-sm mx-auto my-8 pb-8" onSubmit={handleSubmit(onSubmit)}>
      <label className={classNames('mb-4 leading-tight flex flex-col')}>
        <span className="text-base font-semibold text-gray-700">
          <T id="file" />
        </span>
        <span className={classNames('mt-1', 'text-xs font-light text-gray-600')} style={{ maxWidth: '90%' }}>
          <T id="keystoreFileFieldDescription" />
        </span>
      </label>

      <div className="w-full mb-10">
        <Controller
          control={control}
          name="keystoreFile"
          as={KeystoreFileInput}
          rules={{
            required: t('required'),
            validate: validateKeystoreFile
          }}
          clearKeystoreFileInput={clearKeystoreFileInput}
        />
        <ErrorKeystoreComponent errors={errors} />
      </div>

      <FormField
        ref={register({
          required: PASSWORD_ERROR_CAPTION,
          pattern: {
            value: PASSWORD_PATTERN,
            message: PASSWORD_ERROR_CAPTION
          }
        })}
        label={t('filePassword')}
        labelDescription={t('filePasswordInputDescription')}
        id="keystore-password"
        type="password"
        name="keystorePassword"
        placeholder="********"
        errorCaption={errors.keystorePassword?.message}
        onFocus={() => setFocusedKeystore(true)}
        onChange={handlePasswordChangeKeystore}
      />
      {isKeystorePasswordError && (
        <PasswordStrengthIndicator validation={passwordValidationKeystore} isPasswordError={isKeystorePasswordError} />
      )}
      {!isKeystorePasswordError && focusedKeystore && (
        <PasswordStrengthIndicator validation={passwordValidationKeystore} isPasswordError={isKeystorePasswordError} />
      )}
      <FormSubmitButton
        loading={submitting}
        style={{ display: 'block', width: '100%', margin: '40px auto', fontSize: 14, fontWeight: 500 }}
      >
        <T id="next" />
      </FormSubmitButton>
    </form>
  );
};

type KeystoreFileInputProps = Pick<FileInputProps, 'value' | 'onChange' | 'name'> & {
  clearKeystoreFileInput: (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => void;
};

const KeystoreFileInput: React.FC<KeystoreFileInputProps> = ({ value, name, clearKeystoreFileInput, onChange }) => {
  const keystoreFile = value?.item?.(0);

  return (
    <FileInput name={name} multiple={false} accept=".tez" onChange={onChange} value={value}>
      <div
        className={classNames(
          'w-full px-4 py-10 flex flex-col items-center',
          'border-2 border-dashed border-gray-400 rounded-md',
          'focus:border-primary-orange',
          'transition ease-in-out duration-200',
          'text-gray-400 text-lg leading-tight',
          'placeholder-alphagray'
        )}
      >
        <div className="flex flex-row justify-center items-center mb-10">
          <span className="text-lg leading-tight text-gray-600" style={{ wordBreak: 'break-word' }}>
            {keystoreFile?.name ?? t('fileInputPrompt')}
          </span>
          {keystoreFile ? (
            <TrashbinIcon
              className="ml-2 w-6 h-auto text-red-700 stroke-current z-10 cursor-pointer"
              style={{ minWidth: '1.5rem' }}
              onClick={clearKeystoreFileInput}
            />
          ) : (
            <PaperclipIcon className="ml-2 w-6 h-auto text-gray-600 stroke-current" />
          )}
        </div>
        <div className="w-40 py-3 rounded bg-blue-600 shadow-sm text-center font-semibold text-sm text-white">
          {t('selectFile')}
        </div>
      </div>
    </FileInput>
  );
};

const handleKukaiWalletError = (err: any, customAlert: AlertFn) => {
  customAlert({
    title: t('errorImportingKukaiWallet'),
    children: err instanceof SyntaxError ? t('fileHasSyntaxError') : err.message
  });
};

interface ErrorKeystoreComponentProps {
  errors: NestDataObject<FormData, FieldError>;
}

const ErrorKeystoreComponent: React.FC<ErrorKeystoreComponentProps> = ({ errors }) =>
  errors.keystoreFile ? <div className="text-xs text-red-500 mt-1">{errors.keystoreFile.message}</div> : null;
