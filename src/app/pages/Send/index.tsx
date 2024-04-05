import React, { memo } from 'react';

import { Divider, PageTitle } from 'app/atoms';
import { ReactComponent as SendIcon } from 'app/icons/send.svg';
import PageLayout from 'app/layouts/PageLayout';
import { useChainSelectController, ChainSelect } from 'app/templates/ChainSelect';
import SendForm from 'app/templates/SendForm';
import { T, t } from 'lib/i18n';
import { UNDER_DEVELOPMENT_MSG } from 'temple/evm/under_dev_msg';
import { SomeChain, useAccountAddressForTezos, useAllTezosChains } from 'temple/front';

interface Props {
  tezosChainId?: string | null;
  assetSlug?: string | null;
}

const Send = memo<Props>(({ tezosChainId, assetSlug }) => {
  const accountTezAddress = useAccountAddressForTezos();

  const allTezosChains = useAllTezosChains();

  const chainSelectController = useChainSelectController();
  const network = tezosChainId ? (allTezosChains[tezosChainId] as SomeChain | undefined) : chainSelectController.value;

  return (
    <PageLayout pageTitle={<PageTitle icon={<SendIcon className="w-auto h-4 stroke-current" />} title={t('send')} />}>
      <div className="w-full max-w-sm mx-auto my-4">
        {tezosChainId ? null : (
          <>
            <div className="flex">
              <span className="text-xl text-gray-900">
                <T id="network" />:
              </span>
              <div className="flex-1" />
              <ChainSelect controller={chainSelectController} />
            </div>

            <Divider className="my-8" />
          </>
        )}

        {accountTezAddress && network && network.chain === 'tezos' ? (
          <SendForm network={network} assetSlug={assetSlug} publicKeyHash={accountTezAddress} />
        ) : (
          <div className="text-center">{UNDER_DEVELOPMENT_MSG}</div>
        )}
      </div>
    </PageLayout>
  );
});

export default Send;
