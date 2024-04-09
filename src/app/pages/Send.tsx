import React, { memo } from 'react';

import { ReactComponent as SendIcon } from 'app/icons/send.svg';
import PageLayout from 'app/layouts/PageLayout';
import SendForm from 'app/templates/SendForm';
import { t } from 'lib/i18n';
import { UNDER_DEVELOPMENT_MSG } from 'temple/evm/under_dev_msg';
import { useAccountAddressForTezos } from 'temple/front';

import { PageTitle } from '../atoms/PageTitle';

interface Props {
  assetSlug?: string | null;
}

const Send = memo<Props>(({ assetSlug }) => {
  const accountTezAddress = useAccountAddressForTezos();

  return (
    <PageLayout pageTitle={<PageTitle icon={<SendIcon className="w-auto h-4 stroke-current" />} title={t('send')} />}>
      <div className="py-4">
        <div className="w-full max-w-sm mx-auto">
          {accountTezAddress ? (
            <SendForm assetSlug={assetSlug} publicKeyHash={accountTezAddress} />
          ) : (
            UNDER_DEVELOPMENT_MSG
          )}
        </div>
      </div>
    </PageLayout>
  );
});

export default Send;