import React from 'react';

import BigNumber from 'bignumber.js';
import { FieldError } from 'react-hook-form';

import { Alert } from 'app/atoms';
import AdditionalFeeInput from 'app/templates/AdditionalFeeInput/AdditionalFeeInput';
import { t, T } from 'lib/i18n';
import { getTezosGasMetadata } from 'lib/metadata';

import SendErrorAlert from './SendErrorAlert';

interface FeeComponentProps extends FeeAlertPropsBase {
  accountPkh: string;
  restFormDisplayed: boolean;
  control: any;
  handleFeeFieldChange: ([v]: any) => any;
  baseFee?: BigNumber | Error | undefined;
  error?: FieldError;
  isSubmitting: boolean;
}

export const FeeSection: React.FC<FeeComponentProps> = ({
  accountPkh,
  tezosChainId,
  restFormDisplayed,
  estimationError,
  control,
  handleFeeFieldChange,
  baseFee,
  error,
  isSubmitting,
  ...rest
}) => {
  if (!restFormDisplayed) return null;

  const metadata = getTezosGasMetadata(tezosChainId);

  return (
    <>
      <FeeAlert {...rest} estimationError={estimationError} accountPkh={accountPkh} tezosChainId={tezosChainId} />

      <AdditionalFeeInput
        name="fee"
        control={control}
        onChange={handleFeeFieldChange}
        gasSymbol={metadata.symbol}
        baseFee={baseFee}
        error={error}
        id="send-fee"
      />
    </>
  );
};

interface FeeAlertPropsBase {
  submitError: unknown;
  estimationError: unknown;
  toResolved: string;
  toFilledWithKTAddress: boolean;
  tezosChainId: string;
}

interface FeeAlertProps extends FeeAlertPropsBase {
  accountPkh: string;
}

const FeeAlert: React.FC<FeeAlertProps> = ({
  submitError,
  estimationError,
  toResolved,
  toFilledWithKTAddress,
  accountPkh,
  tezosChainId
}) => {
  if (submitError) return <SendErrorAlert type="submit" error={submitError} tezosChainId={tezosChainId} />;

  if (estimationError) return <SendErrorAlert type="estimation" error={estimationError} tezosChainId={tezosChainId} />;

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
