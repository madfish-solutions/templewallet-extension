import React, { FC } from 'react';

import { ReactComponent as SendIcon } from 'app/icons/send.svg';
import PageLayout from 'app/layouts/PageLayout';
import SendForm from 'app/templates/SendForm';
import { t } from 'lib/i18n/react';

type SendProps = {
  assetSlug?: string | null;
};

const Send: FC<SendProps> = ({ assetSlug }) => (
  <PageLayout
    pageTitle={
      <>
        <SendIcon className="w-auto h-4 mr-1 stroke-current" /> {t('send')}
      </>
    }
  >
    <div className="py-4">
      <div className="w-full max-w-sm mx-auto">
        <SendForm assetSlug={assetSlug} />
      </div>
    </div>
  </PageLayout>
);

export default Send;
