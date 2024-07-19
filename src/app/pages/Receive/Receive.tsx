import React, { memo, useCallback, useState } from 'react';

import classNames from 'clsx';

import { FormField, PageTitle, QRCode } from 'app/atoms';
import { useModalOpenSearchParams } from 'app/hooks/use-modal-open-search-params';
import { ReactComponent as GlobeIcon } from 'app/icons/globe.svg';
import { ReactComponent as HashIcon } from 'app/icons/hash.svg';
import { ReactComponent as CopyIcon } from 'app/icons/monochrome/copy.svg';
import PageLayout from 'app/layouts/PageLayout';
import { AccountsModal } from 'app/templates/AppHeader/AccountsModal';
import ViewsSwitcher, { ViewsSwitcherProps } from 'app/templates/ViewsSwitcher/ViewsSwitcher';
import { setTestID } from 'lib/analytics';
import { T, t } from 'lib/i18n';
import { getIdenticonUri } from 'lib/temple/front';
import { useSafeState } from 'lib/ui/hooks';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';
import { useAccount, useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';
import { useTezosDomainNameByAddress } from 'temple/front/tezos';
import { TezosNetworkEssentials } from 'temple/networks';
import { TempleChainKind } from 'temple/types';

import { AccountDropdownHeader } from './AccountDropdownHeader';
import { NetworkCard } from './NetworkCard';
import { ReceiveSelectors } from './Receive.selectors';
import { ReceiveModal } from './ReceiveModal';
import { ReceivePayload } from './types';

/* const ADDRESS_FIELD_VIEWS = [
  {
    Icon: GlobeIcon,
    key: 'domain',
    name: t('domain')
  },
  {
    Icon: HashIcon,
    key: 'hash',
    name: t('hash')
  }
]; */

export const Receive = memo(() => {
  const account = useAccount();
  const tezosAddress = useAccountAddressForTezos();
  const evmAddress = useAccountAddressForEvm();
  const {
    isOpen: accountsModalIsOpen,
    openModal: openAccountsModal,
    closeModal: closeAccountsModal
  } = useModalOpenSearchParams('accountsModal');
  const [receivePayload, setReceivePayload] = useState<ReceivePayload | null>(null);

  const resetReceivePayload = useCallback(() => setReceivePayload(null), []);

  return (
    <PageLayout pageTitle={<PageTitle title={t('receive')} />} paperClassName="!bg-background">
      <AccountsModal opened={accountsModalIsOpen} onRequestClose={closeAccountsModal} />
      <AccountDropdownHeader className="mb-5" account={account} onClick={openAccountsModal} />
      {receivePayload && <ReceiveModal onClose={resetReceivePayload} {...receivePayload} />}
      <span className="text-font-description-bold">
        <T id="networkToReceive" />
      </span>
      <div className="mt-3 flex flex-col gap-y-3">
        {evmAddress && (
          <NetworkCard address={evmAddress} chainKind={TempleChainKind.EVM} onQRClick={setReceivePayload} />
        )}
        {tezosAddress && (
          <NetworkCard address={tezosAddress} chainKind={TempleChainKind.Tezos} onQRClick={setReceivePayload} />
        )}
      </div>
    </PageLayout>
  );
});

/* interface ReceiveContentProps {
  address: string;
  labelTitle: string;
  tezosNetwork?: TezosNetworkEssentials;
}

const ReceiveContent = memo<ReceiveContentProps>(({ address, labelTitle, tezosNetwork }) => {
  const { fieldRef, copy, copied } = useCopyToClipboard();
  const [activeView, setActiveView] = useSafeState(ADDRESS_FIELD_VIEWS[1]);

  const { data: reverseName } = useTezosDomainNameByAddress(address, tezosNetwork);

  return (
    <>
      <FormField
        extraSection={reverseName && <AddressFieldExtraSection activeView={activeView} onSwitch={setActiveView} />}
        textarea
        rows={2}
        ref={fieldRef}
        id="receive-address"
        label={labelTitle}
        labelDescription={t('accountAddressLabel')}
        value={activeView.key === 'hash' || !reverseName ? address : reverseName}
        size={36}
        spellCheck={false}
        readOnly
        style={{
          resize: 'none'
        }}
        testID={ReceiveSelectors.addressValue}
      />

      <button
        type="button"
        className={classNames(
          'flex items-center justify-center mx-auto mb-6 py-1 px-2 w-40',
          'border rounded border-primary-orange bg-primary-orange shadow-sm',
          'text-sm font-semibold text-primary-orange-lighter text-shadow-black-orange',
          'opacity-90 hover:opacity-100 focus:opacity-100 hover:shadow focus:shadow',
          'transition duration-300 ease-in-out'
        )}
        onClick={copy}
        {...setTestID(ReceiveSelectors.copyToClipboardButton)}
      >
        {copied ? (
          <T id="copiedAddress" />
        ) : (
          <>
            <CopyIcon className="mr-1 h-4 w-auto stroke-current stroke-2" />
            <T id="copyAddressToClipboard" />
          </>
        )}
      </button>

      <div className="flex flex-col items-center">
        <div className="mb-2 leading-tight text-center">
          <span className="text-sm font-semibold text-gray-700">
            <T id="qrCode" />
          </span>
        </div>

        <div className="mb-4 p-1 bg-gray-100 border-2 border-gray-300 rounded">
          <QRCode size={220} data={address} imageUri={getIdenticonUri(address, 64, 'botttsneutral', { radius: 16 })} />
        </div>
      </div>
    </>
  );
});

export default Receive;

type AddressFieldExtraSectionProps = {
  activeView: ViewsSwitcherProps['activeItem'];
  onSwitch: ViewsSwitcherProps['onChange'];
};

const AddressFieldExtraSection = memo<AddressFieldExtraSectionProps>(props => {
  const { activeView, onSwitch } = props;

  return (
    <div className="mb-2 flex justify-end">
      <ViewsSwitcher activeItem={activeView} items={ADDRESS_FIELD_VIEWS} onChange={onSwitch} />
    </div>
  );
}); */
