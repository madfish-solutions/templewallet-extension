import React, { FC, useCallback, useMemo, useState } from 'react';

import { nanoid } from 'nanoid';
import { Controller, useForm } from 'react-hook-form';

import { T, t } from '../../../lib/i18n';
import { assertResponse, request, useTempleClient } from '../../../lib/temple/front';
import { TempleMessageType } from '../../../lib/temple/types';
import { FormSubmitButton, HashChip, NoSpaceField } from '../../atoms';
import AssetField from '../../atoms/AssetField';
import Spinner from '../../atoms/Spinner/Spinner';
import { SendFormSelectors } from '../../templates/SendForm/selectors';
import { NonTezosToken } from './TokenPage';

interface FormData {
  to: string;
  amount: string;
}

interface Props {
  isBitcoin: boolean;
  accountPkh?: string;
  token?: NonTezosToken;
}

export const SendTab: FC<Props> = ({ token, isBitcoin, accountPkh }) => {
  const [isProcessing, setProcessing] = useState(false);
  const [hash, setHash] = useState<string | null>();
  const { confirmationIdRef } = useTempleClient();

  const { watch, handleSubmit, control, setValue, formState } = useForm<FormData>({
    mode: 'onChange'
  });

  const toValue = watch('to');

  const cleanToField = useCallback(() => {
    setValue('to', '');
  }, [setValue]);

  const rpcUrl = useMemo(() => {
    switch (token?.chainName) {
      case 'Ethereum Sepolia':
        return 'https://ethereum-sepolia.publicnode.com';
      case 'Polygon Mumbai':
        return 'https://polygon-mumbai-bor.publicnode.com';
      case 'BSC Testnet':
        return 'https://bsc-testnet.publicnode.com';
      default:
        return '';
    }
  }, [token?.chainName]);

  const onSubmit = async ({ to, amount }: FormData) => {
    if (!accountPkh || !token) return;

    setProcessing(true);

    const id = nanoid();
    confirmationIdRef.current = id;

    const res = await request({
      type: TempleMessageType.EvmOperationsRequest,
      id,
      sourcePkh: accountPkh,
      networkRpc: rpcUrl,
      toAddress: to,
      token,
      amount
    });
    assertResponse(res.type === TempleMessageType.EvmOperationsResponse);

    setHash(res.txHash);
    setProcessing(false);
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center">
        <div>
          <Spinner theme="gray" className="w-20" />
        </div>
      </div>
    );
  }

  return (
    <form className="min-h-96 max-w-sm mx-auto mt-4" onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="to"
        as={<NoSpaceField extraInnerWrapper="unset" />}
        control={control}
        onChange={([v]) => v}
        textarea
        rows={2}
        placeholder={`e.g. ${isBitcoin ? 'tb1qufwmq' : '0xe03CE86'}...`}
        cleanable={Boolean(toValue)}
        onClean={cleanToField}
        id="send-to"
        label={t('recipient')}
        labelDescription={`${isBitcoin ? 'Bitcoin' : 'EVM'} address to send funds to`}
        style={{
          resize: 'none'
        }}
        containerClassName="mb-4"
        testID={SendFormSelectors.recipientInput}
      />
      <Controller
        name="amount"
        as={<AssetField />}
        control={control}
        onChange={([v]) => v}
        id="send-amount"
        assetSymbol={token.symbol}
        assetDecimals={token.decimals}
        label={t('amount')}
        placeholder={t('amountPlaceholder')}
        containerClassName="mb-4"
      />

      <FormSubmitButton loading={formState.isSubmitting || isProcessing}>
        <T id="send" />
      </FormSubmitButton>

      {hash && (
        <span>
          Tx hash: <HashChip hash={hash} firstCharsCount={10} lastCharsCount={7} small className="mr-2" />
        </span>
      )}
    </form>
  );
};
