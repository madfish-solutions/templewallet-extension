import React, { memo } from 'react';

import { PageTitle } from 'app/atoms';
import { ReactComponent as SendIcon } from 'app/icons/send.svg';
import PageLayout from 'app/layouts/PageLayout';
import { useChainSelectController, ChainSelectSection } from 'app/templates/ChainSelect';
import SendForm from 'app/templates/SendForm';
import { t } from 'lib/i18n';
import { UNDER_DEVELOPMENT_MSG } from 'temple/evm/under_dev_msg';
import { OneOfChains, useAccountForTezos, useAllTezosChains } from 'temple/front';

interface Props {
  tezosChainId?: string | null;
  assetSlug?: string | null;
}

const Send = memo<Props>(({ tezosChainId, assetSlug }) => {
  const tezosAccount = useAccountForTezos();

  const allTezosChains = useAllTezosChains();

  const chainSelectController = useChainSelectController();
  const network = tezosChainId
    ? (allTezosChains[tezosChainId] as OneOfChains | undefined)
    : chainSelectController.value;

  return (
    <PageLayout pageTitle={<PageTitle Icon={SendIcon} title={t('send')} />}>
      <>
        {tezosChainId ? null : <ChainSelectSection controller={chainSelectController} />}

        {tezosAccount && network && network.kind === 'tezos' ? (
          <SendForm network={network} tezosAccount={tezosAccount} assetSlug={assetSlug} />
        ) : (
          <div className="text-center">{UNDER_DEVELOPMENT_MSG}</div>
        )}
      </>
    </PageLayout>
  );
});

export default Send;
