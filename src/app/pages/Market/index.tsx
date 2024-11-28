import React, { FC, memo } from 'react';

import { CaptionAlert, IconBase, PageTitle } from 'app/atoms';
import { IconBaseProps } from 'app/atoms/IconBase';
import { ReactComponent as CardIcon } from 'app/icons/base/card.svg';
import { ReactComponent as ExchangeIcon } from 'app/icons/base/exchange.svg';
import PageLayout from 'app/layouts/PageLayout';
import { t } from 'lib/i18n/react';
import { Link } from 'lib/woozie';

export const Market = memo(() => {
  return (
    <PageLayout pageTitle={<PageTitle title={t('market')} />} noScroll>
      <CaptionAlert type="info" message={t('marketPageDisclaimer')} className="mb-4" />

      <Option Icon={ExchangeIcon} title={t('cryptoExchange')} description={t('cryptoExchangeDescription')} />
      <Link to="/buy/debit">
        <Option Icon={CardIcon} title={t('debitCreditCard')} description={t('debitCreditCardDescription')} />
      </Link>
    </PageLayout>
  );
});

interface OptionProps extends Pick<IconBaseProps, 'Icon'> {
  title: string;
  description: string;
  onClick?: EmptyFn;
}

const Option: FC<OptionProps> = ({ Icon, title, description, onClick }) => (
  <div
    className="cursor-pointer flex justify-between items-center mb-3 p-3 gap-x-3 rounded-lg shadow-bottom border-0.5 border-transparent hover:border-lines"
    onClick={onClick}
  >
    <CircleIcon Icon={Icon} size={32} className="text-primary" />

    <div className="flex flex-col gap-y-1">
      <span className="text-font-medium-bold">{title}</span>
      <span className="text-font-description text-grey-1">{description}</span>
    </div>
  </div>
);

const CircleIcon: FC<IconBaseProps> = props => (
  <div className="flex justify-center items-center bg-primary-low p-3 rounded-full">
    <IconBase {...props} />
  </div>
);
