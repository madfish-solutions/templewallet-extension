import React, { FC, useMemo, useState } from 'react';

import classNames from 'clsx';

import { ReactComponent as CodeAltIcon } from 'app/icons/code-alt.svg';
import { ReactComponent as EyeIcon } from 'app/icons/eye.svg';
import { ReactComponent as HashIcon } from 'app/icons/hash.svg';
import ExpensesView, { ModifyFeeAndLimit } from 'app/templates/ExpensesView/ExpensesView';
import OperationsBanner from 'app/templates/OperationsBanner/OperationsBanner';
import RawPayloadView from 'app/templates/RawPayloadView';
import ViewsSwitcher from 'app/templates/ViewsSwitcher/ViewsSwitcher';
import { TEZ_TOKEN_SLUG, toTokenSlug } from 'lib/assets';
import { T, t } from 'lib/i18n';
import { tryParseExpenses } from 'lib/temple/front';
import { TempleTezosDAppOperationsPayload, TempleTezosDAppSignPayload } from 'lib/temple/types';
import { TezosNetworkEssentials } from 'temple/networks';

interface TezosOperationViewProps {
  network: TezosNetworkEssentials;
  payload: TempleTezosDAppOperationsPayload | TempleTezosDAppSignPayload;
  error?: any;
  modifyFeeAndLimit?: ModifyFeeAndLimit;
}

const TezosOperationView: FC<TezosOperationViewProps> = ({
  network,
  payload,
  error: payloadError,
  modifyFeeAndLimit
}) => {
  const contentToParse = useMemo(() => {
    switch (payload.type) {
      case 'confirm_operations':
        return (payload.rawToSign ?? payload.opParams) || [];
      case 'sign':
        return payload.preview || [];
      default:
        return [];
    }
  }, [payload]);

  const rawExpensesData = useMemo(
    () => tryParseExpenses(contentToParse, payload.sourcePkh),
    [contentToParse, payload.sourcePkh]
  );

  const expensesData = useMemo(() => {
    return rawExpensesData.map(({ expenses, ...restRaw }) => ({
      expenses: expenses.map(({ tokenAddress, tokenId, ...restProps }) => ({
        assetSlug: tokenAddress ? toTokenSlug(tokenAddress, tokenId) : TEZ_TOKEN_SLUG,
        tokenAddress,
        tokenId,
        ...restProps
      })),
      ...restRaw
    }));
  }, [rawExpensesData]);

  const signPayloadFormats = useMemo(() => {
    const rawFormat = {
      key: 'raw',
      name: t('raw'),
      Icon: CodeAltIcon
    };
    const prettyViewFormats = [
      {
        key: 'preview',
        name: t('preview'),
        Icon: EyeIcon
      }
    ];

    if (payload.type === 'confirm_operations') {
      return [
        ...prettyViewFormats,
        rawFormat,
        ...(payload.bytesToSign
          ? [
              {
                key: 'bytes',
                name: t('bytes'),
                Icon: HashIcon
              }
            ]
          : [])
      ];
    }

    return [
      ...(rawExpensesData.length > 0 ? prettyViewFormats : []),
      rawFormat,
      {
        key: 'bytes',
        name: t('bytes'),
        Icon: HashIcon
      }
    ];
  }, [payload, rawExpensesData]);

  const [spFormat, setSpFormat] = useState(signPayloadFormats[0]);

  if (payload.type === 'sign' && payload.preview) {
    return (
      <div className="flex flex-col w-full">
        <h2 className="mb-3 leading-tight flex items-center">
          <span className="mr-2 text-base font-semibold text-gray-700">
            <T id="payloadToSign" />
          </span>

          <div className="flex-1" />

          <ViewsSwitcher activeItem={spFormat} items={signPayloadFormats} onChange={setSpFormat} />
        </h2>

        <OperationsBanner
          opParams={payload.preview}
          className={classNames(spFormat.key !== 'raw' && 'hidden')}
          jsonViewStyle={{ height: '11rem', maxHeight: '100%', overflow: 'auto' }}
        />

        <RawPayloadView
          payload={payload.payload}
          className={classNames(spFormat.key !== 'bytes' && 'hidden')}
          style={{ marginBottom: 0, height: '11rem' }}
        />

        <div className={classNames(spFormat.key !== 'preview' && 'hidden')}>
          <ExpensesView tezosNetwork={network} error={payloadError} expenses={expensesData} />
        </div>
      </div>
    );
  }

  if (payload.type === 'sign') {
    return (
      <RawPayloadView
        label={t('payloadToSign')}
        payload={payload.payload}
        style={{ marginBottom: 0, height: '11rem' }}
        fieldWrapperBottomMargin={false}
      />
    );
  }

  if (payload.type === 'confirm_operations') {
    return (
      <div className="flex flex-col w-full">
        <h2 className="mb-3 leading-tight flex items-center">
          <span className="mr-2 text-base font-semibold text-gray-700">
            <T id="operations" />
          </span>

          <div className="flex-1" />

          {signPayloadFormats.length > 1 && (
            <ViewsSwitcher activeItem={spFormat} items={signPayloadFormats} onChange={setSpFormat} />
          )}
        </h2>

        {payload.bytesToSign && (
          <RawPayloadView
            payload={payload.bytesToSign}
            className={classNames(spFormat.key !== 'bytes' && 'hidden')}
            style={{ marginBottom: 0, height: '11rem' }}
            fieldWrapperBottomMargin={false}
          />
        )}

        <OperationsBanner
          opParams={payload.rawToSign ?? payload.opParams}
          className={classNames(spFormat.key !== 'raw' && 'hidden')}
          jsonViewStyle={signPayloadFormats.length > 1 ? { height: '11rem' } : undefined}
          label={null}
        />

        <div className={classNames(spFormat.key !== 'preview' && 'hidden')}>
          <ExpensesView
            tezosNetwork={network}
            expenses={expensesData}
            estimates={payload.estimates}
            modifyFeeAndLimit={modifyFeeAndLimit}
            error={payloadError}
          />
        </div>
      </div>
    );
  }

  return null;
};

export default TezosOperationView;
