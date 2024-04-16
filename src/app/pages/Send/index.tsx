import React, { memo } from 'react';

import { PageTitle } from 'app/atoms';
import { ReactComponent as SendIcon } from 'app/icons/send.svg';
import { ContentContainer } from 'app/layouts/ContentContainer';
import PageLayout from 'app/layouts/PageLayout';
import { useChainSelectController, ChainSelectSection } from 'app/templates/ChainSelect';
import SendForm from 'app/templates/SendForm';
import { t } from 'lib/i18n';
import { UNDER_DEVELOPMENT_MSG } from 'temple/evm/under_dev_msg';
import { SomeChain, useAccountForTezos, useAllTezosChains } from 'temple/front';

interface Props {
  tezosChainId?: string | null;
  assetSlug?: string | null;
}

const Send = memo<Props>(({ tezosChainId, assetSlug }) => {
  const tezosAccount = useAccountForTezos();

  const allTezosChains = useAllTezosChains();

  const chainSelectController = useChainSelectController();
  const network = tezosChainId ? (allTezosChains[tezosChainId] as SomeChain | undefined) : chainSelectController.value;

  return (
    <PageLayout pageTitle={<PageTitle icon={<SendIcon className="w-auto h-4 stroke-current" />} title={t('send')} />}>
      <ContentContainer className="my-4">
        {tezosChainId ? null : <ChainSelectSection controller={chainSelectController} />}

        {tezosAccount && network && network.kind === 'tezos' ? (
          <SendForm network={network} tezosAccount={tezosAccount} assetSlug={assetSlug} />
        ) : (
          <div className="text-center">{UNDER_DEVELOPMENT_MSG}</div>
        )}
      </ContentContainer>
    </PageLayout>
  );
});

export default Send;
