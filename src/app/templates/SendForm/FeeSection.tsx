import React from 'react';

import BigNumber from 'bignumber.js';
import { FieldError } from 'react-hook-form';

import { Alert, FormSubmitButton } from 'app/atoms';
import AdditionalFeeInput from 'app/templates/AdditionalFeeInput/AdditionalFeeInput';
import { useGasToken } from 'lib/assets/hooks';
import { t, T } from 'lib/i18n';
import { useTezosAccountAddress } from 'temple/hooks';

import { SendFormSelectors } from './selectors';
import SendErrorAlert from './SendErrorAlert';

interface FeeComponentProps extends FeeAlertPropsBase {
  restFormDisplayed: boolean;
  control: any;
  handleFeeFieldChange: ([v]: any) => any;
  baseFee?: BigNumber | Error | undefined;
  error?: FieldError;
  isSubmitting: boolean;
}

export const FeeSection: React.FC<FeeComponentProps> = ({
  restFormDisplayed,
  estimationError,
  control,
  handleFeeFieldChange,
  baseFee,
  error,
  isSubmitting,
  ...rest
}) => {
  const publicKeyHash = useTezosAccountAddress();
  const { metadata } = useGasToken();

  if (!restFormDisplayed) return null;

  return (
    <>
      <FeeAlert {...rest} estimationError={estimationError} accountPkh={publicKeyHash} />

      <AdditionalFeeInput
        name="fee"
        control={control}
        onChange={handleFeeFieldChange}
        assetSymbol={metadata.symbol}
        baseFee={baseFee}
        error={error}
        id="send-fee"
      />

      <FormSubmitButton
        loading={isSubmitting}
        disabled={Boolean(estimationError)}
        testID={SendFormSelectors.sendButton}
      >
        <T id="send" />
      </FormSubmitButton>
    </>
  );
};

interface FeeAlertPropsBase {
  submitError: unknown;
  estimationError: unknown;
  toResolved: string;
  toFilledWithKTAddress: boolean;
}

interface FeeAlertProps extends FeeAlertPropsBase {
  accountPkh: string;
}

const FeeAlert: React.FC<FeeAlertProps> = ({
  submitError,
  estimationError,
  toResolved,
  toFilledWithKTAddress,
  accountPkh
}) => {
  if (submitError) return <SendErrorAlert type="submit" error={submitError} />;

  if (estimationError) return <SendErrorAlert type="estimation" error={estimationError} />;

  if (toResolved === accountPkh)
    return (
      <Alert
        type="warning"
        title={t('attentionExclamation')}
        description={<T id="tryingToTransferToYourself" />}
        className="mt-6 mb-4"
      />
    );

  if (toFilledWithKTAddress)
    return (
      <Alert
        type="warning"
        title={t('attentionExclamation')}
        description={<T id="tryingToTransferToContract" />}
        className="mt-6 mb-4"
      />
    );

  return null;
};
