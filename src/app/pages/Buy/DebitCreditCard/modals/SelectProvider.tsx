import React, { FC, memo, useCallback } from 'react';

import clsx from 'clsx';
import { useFormContext } from 'react-hook-form';

import { EmptyState } from 'app/atoms/EmptyState';
import Money from 'app/atoms/Money';
import { PageModal } from 'app/atoms/PageModal';
import { TopUpProviderIcon } from 'app/templates/TopUpProviderIcon';
import { TopUpProviderId } from 'lib/buy-with-credit-card/top-up-provider-id.enum';
import { PaymentProviderInterface } from 'lib/buy-with-credit-card/topup.interface';
import { T, TID } from 'lib/i18n';

import { InfoContainer } from '../../info-block';
import { NewQuoteLabel } from '../components/NewQuoteLabel';
import { VALUE_PLACEHOLDER } from '../config';
import { BuyWithCreditCardFormData, DefaultModalProps } from '../types';

interface Props extends DefaultModalProps {
  paymentProvidersToDisplay: PaymentProviderInterface[];
  lastFormRefreshTimestamp: number;
  onProviderSelect?: SyncFn<PaymentProviderInterface>;
}

export const SelectProviderModal: FC<Props> = ({
  title,
  opened,
  onRequestClose,
  paymentProvidersToDisplay,
  lastFormRefreshTimestamp,
  onProviderSelect
}) => {
  const { watch, setValue } = useFormContext<BuyWithCreditCardFormData>();

  const activeProvider = watch('provider');

  const handleProviderSelect = useCallback(
    (p: PaymentProviderInterface) => {
      setValue('provider', p);
      onProviderSelect?.(p);
      onRequestClose?.();
    },
    [setValue, onProviderSelect, onRequestClose]
  );

  return (
    <PageModal title={title} opened={opened} onRequestClose={onRequestClose}>
      <NewQuoteLabel title="providers" lastFormRefreshTimestamp={lastFormRefreshTimestamp} className="m-4" />

      <div className="flex flex-col px-4 pb-4">
        {paymentProvidersToDisplay.length === 0 ? (
          <EmptyState stretch />
        ) : (
          <>
            {paymentProvidersToDisplay.map(p => (
              <Provider key={p.id} current={p} activeId={activeProvider?.id} onClick={handleProviderSelect} />
            ))}
          </>
        )}
      </div>
    </PageModal>
  );
};

interface ProviderProps {
  current: PaymentProviderInterface;
  activeId?: TopUpProviderId;
  onClick?: SyncFn<PaymentProviderInterface>;
}

const Provider: FC<ProviderProps> = ({ current, activeId, onClick }) => {
  const active = current.id === activeId;

  const handleClick = useCallback(() => onClick?.(current), [current, onClick]);

  return (
    <InfoContainer className={clsx('cursor-pointer mb-4 pt-3 pb-0', active && '!border-primary')} onClick={handleClick}>
      <div className="flex flex-row justify-between pb-3">
        <div className="flex flex-row gap-x-2">
          <TopUpProviderIcon providerId={current.id} size={40} />
          <div className="flex flex-col">
            <span className="text-font-medium-bold">{current.name}</span>
            <span className="text-font-num-12 text-grey-1">
              {current.minInputAmount && current.maxInputAmount ? (
                <>
                  <Money smallFractionFont={false}>{current.minInputAmount}</Money>
                  {' - '}
                  <Money smallFractionFont={false}>{current.maxInputAmount}</Money> {current.inputSymbol}
                </>
              ) : (
                VALUE_PLACEHOLDER
              )}
            </span>
          </div>
        </div>
        <div className="flex flex-row justify-end items-start gap-x-1">
          {!current.kycRequired && <Tag title="noKycRequired" className="bg-black" />}
          {current.isBestPrice && <Tag title="bestPrice" className="bg-success" />}
        </div>
      </div>
      <div className="py-3 flex flex-row justify-between items-center border-t-0.5">
        <p className="p-1 text-font-medium text-grey-1">
          <T id="youGet" />:
        </p>
        <span className="text-font-num-14 p-1">
          {current.outputAmount ? (
            <>
              {'≈ '}
              <Money smallFractionFont={false}>{current.outputAmount}</Money> {current.outputSymbol}
            </>
          ) : (
            VALUE_PLACEHOLDER
          )}
        </span>
      </div>
    </InfoContainer>
  );
};

interface TagProps {
  title: TID;
  className?: string;
}

const Tag = memo<TagProps>(({ title, className }) => (
  <div className={clsx('p-1 text-font-small-bold text-white rounded', className)}>
    <T id={title} />
  </div>
));
