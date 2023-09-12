import React, { FC, ReactNode, useCallback, useRef } from 'react';

import clsx from 'clsx';
import { useForm, Controller } from 'react-hook-form';

import { Alert, FileInputProps, FileInput, FormField, FormSubmitButton } from 'app/atoms';
import { useFormAnalytics } from 'lib/analytics';
import { TID, T, t } from 'lib/i18n';
import { ActivationStatus, useTempleClient, useSetAccountPkh, useTezos, activateAccount } from 'lib/temple/front';
import { confirmOperation } from 'lib/temple/operation';
import { useSafeState } from 'lib/ui/hooks';
import { delay } from 'lib/utils';
import { navigate } from 'lib/woozie';

import { ImportAccountFormType } from './selectors';

interface FaucetData {
  mnemonic: string[];
  amount: string;
  pkh: string;
  password: string;
  email: string;
  secret: string;
  activation_code: string;
}

interface FaucetTextInputFormData {
  text: string;
}

export const FromFaucetForm: FC = () => {
  const { importFundraiserAccount } = useTempleClient();
  const setAccountPkh = useSetAccountPkh();
  const tezos = useTezos();
  const formAnalytics = useFormAnalytics(ImportAccountFormType.FaucetFile);

  const { control, handleSubmit: handleTextFormSubmit, watch, errors, setValue } = useForm<FaucetTextInputFormData>();
  const textFieldRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [processing, setProcessing] = useSafeState(false);
  const [alert, setAlert] = useSafeState<ReactNode | Error>(null);
  const textFieldValue = watch('text');

  const handleTextFieldFocus = useCallback(() => textFieldRef.current?.focus(), []);
  const cleanTextField = useCallback(() => setValue('text', ''), [setValue]);

  const handleFormSubmit = useCallback((evt: React.FormEvent<HTMLFormElement>) => {
    evt.preventDefault();
  }, []);

  const importAccount = useCallback(
    async (data: FaucetData) => {
      const [activationStatus, op] = await activateAccount(data.pkh, data.secret ?? data.activation_code, tezos);

      if (activationStatus === ActivationStatus.ActivationRequestSent) {
        setAlert(`🛫 ${t('requestSent', t('activationOperationType'))}`);
        await confirmOperation(tezos, op!.hash);
      }

      try {
        await importFundraiserAccount(data.email, data.password, data.mnemonic.join(' '));
      } catch (err: any) {
        if (/Account already exists/.test(err?.message)) {
          setAccountPkh(data.pkh);
          navigate('/');
          return;
        }

        throw err;
      }
    },
    [importFundraiserAccount, setAccountPkh, setAlert, tezos]
  );

  const onTextFormSubmit = useCallback(
    async (formData: FaucetTextInputFormData) => {
      if (processing) {
        return;
      }

      formAnalytics.trackSubmit();
      setProcessing(true);
      setAlert(null);

      try {
        await importAccount(toFaucetJSON(formData.text));

        formAnalytics.trackSubmitSuccess();
      } catch (err: any) {
        formAnalytics.trackSubmitFail();

        console.error(err);

        // Human delay.
        await delay();

        setAlert(err);
      } finally {
        setProcessing(false);
      }
    },
    [importAccount, processing, setAlert, setProcessing, formAnalytics]
  );

  const handleUploadChange = useCallback(
    async (files?: FileList) => {
      const inputFile = files?.item(0);

      if (processing || !inputFile) return;
      setProcessing(true);
      setAlert(null);

      try {
        let data: FaucetData;
        try {
          data = await new Promise((res, rej) => {
            const reader = new FileReader();

            reader.onerror = () => {
              rej();
              reader.abort();
            };

            reader.onload = (readEvt: any) => {
              try {
                res(toFaucetJSON(readEvt.target.result));
              } catch (err: any) {
                rej(err);
              }
            };

            reader.readAsText(inputFile);
          });
        } catch (_err) {
          throw new Error(t('unexpectedOrInvalidFile'));
        }

        await importAccount(data);
      } catch (err: any) {
        console.error(err);

        // Human delay.
        await delay();

        setAlert(err);
      } finally {
        formRef.current?.reset();
        setProcessing(false);
      }
    },
    [importAccount, processing, setAlert, setProcessing]
  );

  return (
    <>
      <form ref={formRef} className="w-full max-w-sm mx-auto mt-8" onSubmit={handleFormSubmit}>
        {alert && (
          <Alert
            type={alert instanceof Error ? 'error' : 'success'}
            title={alert instanceof Error ? t('error') : t('success')}
            description={alert instanceof Error ? alert?.message ?? t('smthWentWrong') : alert}
            className="mb-6"
          />
        )}

        <div className="flex flex-col w-full">
          <label className="mb-4 leading-tight flex flex-col">
            <span className="text-base font-semibold text-gray-700">
              <T id="faucetFile" />
            </span>

            <span className="mt-1 text-xs font-light text-gray-600 max-w-9/10">
              <T
                id="faucetFileInputPrompt"
                substitutions={[
                  <a
                    href="https://teztnets.xyz/"
                    key="link"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-normal underline"
                  >
                    https://teztnets.xyz/
                  </a>
                ]}
              />
            </span>
          </label>

          <FaucetFileInput disabled={processing} onChange={handleUploadChange} />
        </div>
      </form>

      <form className="w-full max-w-sm mx-auto my-8" onSubmit={handleTextFormSubmit(onTextFormSubmit)}>
        <Controller
          name="text"
          as={<FormField className="font-mono" ref={textFieldRef} />}
          control={control}
          rules={{
            validate: validateFaucetTextInput
          }}
          onChange={([v]) => v}
          onFocus={handleTextFieldFocus}
          textarea
          rows={5}
          cleanable={Boolean(textFieldValue)}
          onClean={cleanTextField}
          id="faucet-text-input"
          label={t('faucetJson')}
          labelDescription={t('faucetJsonDescription')}
          placeholder={'{ ... }'}
          errorCaption={errors.text?.message && t(errors.text.message.toString() as TID)}
          className="text-xs"
          style={{
            resize: 'none'
          }}
          containerClassName="mb-4"
        />
        <div className="w-full flex">
          <FormSubmitButton loading={processing}>
            <T id="submit" />
          </FormSubmitButton>
        </div>
      </form>
    </>
  );
};

function validateFaucetTextInput(text?: string) {
  if (!text) {
    return 'required';
  }
  try {
    toFaucetJSON(text);
    return true;
  } catch (e) {
    if (e instanceof SyntaxError) {
      return 'invalidJsonInput';
    }
    return 'notFaucetJson';
  }
}

function toFaucetJSON(text: string) {
  const data = JSON.parse(text);
  if (![data.pkh, data.secret ?? data.activation_code, data.mnemonic, data.email, data.password].every(Boolean)) {
    throw new Error();
  }
  return data;
}

type FaucetFileInputProps = Pick<FileInputProps, 'disabled' | 'onChange'>;

const FaucetFileInput: React.FC<FaucetFileInputProps> = ({ disabled, onChange }) => (
  <FileInput
    className="mb-2"
    name="documents[]"
    accept=".json,application/json"
    disabled={disabled}
    onChange={onChange}
  >
    <div
      className={clsx(
        'w-full',
        'px-4 py-6',
        'border-2 border-dashed',
        'border-gray-300',
        'focus:border-primary-orange',
        'bg-gray-100 focus:bg-transparent',
        'focus:outline-none focus:shadow-outline',
        'transition ease-in-out duration-200',
        'rounded-md',
        'text-gray-400 text-lg leading-tight',
        'placeholder-alphagray'
      )}
    >
      <svg
        width={48}
        height={48}
        viewBox="0 0 24 24"
        aria-labelledby="uploadIconTitle"
        stroke="#e2e8f0"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
        color="#e2e8f0"
        className="m-4 mx-auto"
      >
        <title>{'Upload'}</title>
        <path d="M12 4v13M7 8l5-5 5 5M20 21H4" />
      </svg>
      <div className="w-full text-center">
        {disabled ? <T id="processing" /> : <T id="selectFileOfFormat" substitutions={[<b key="format">JSON</b>]} />}
      </div>
    </div>
  </FileInput>
);
