import React, { FC, memo, useEffect } from 'react';

import classNames from 'clsx';
import { QRCode } from 'react-qr-svg';

import { FormField, PageTitle } from 'app/atoms';
import { ReactComponent as CopyIcon } from 'app/icons/copy.svg';
import { ReactComponent as GlobeIcon } from 'app/icons/globe.svg';
import { ReactComponent as HashIcon } from 'app/icons/hash.svg';
import { ReactComponent as QRIcon } from 'app/icons/qr.svg';
import PageLayout from 'app/layouts/PageLayout';
import ViewsSwitcher, { ViewsSwitcherProps } from 'app/templates/ViewsSwitcher/ViewsSwitcher';
import { setTestID } from 'lib/analytics';
import { T, t } from 'lib/i18n';
import { useSafeState } from 'lib/ui/hooks';
import useCopyToClipboard from 'lib/ui/useCopyToClipboard';
import { useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';
import { useTezosDomainNameByAddress, useTezosDomainsClient } from 'temple/front/tzdns';

import { ReceiveSelectors } from './Receive.selectors';

const ADDRESS_FIELD_VIEWS = [
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
];

const Receive = memo(() => {
  const tezosAddress = useAccountAddressForTezos();
  const evmAddress = useAccountAddressForEvm();

  return (
    <PageLayout pageTitle={<PageTitle icon={<QRIcon className="w-auto h-4 stroke-current" />} title={t('receive')} />}>
      <div className="py-4">
        <div className="w-full max-w-sm mx-auto">
          {tezosAddress ? <ReceiveContent labelTitle="Tezos address" address={tezosAddress} /> : null}
          {evmAddress ? <ReceiveContent labelTitle="EVM address" address={evmAddress} /> : null}
        </div>
      </div>
    </PageLayout>
  );
});

const ReceiveContent: FC<{ address: string; labelTitle: string }> = ({ address, labelTitle }) => {
  const { isSupported } = useTezosDomainsClient();

  const { fieldRef, copy, copied } = useCopyToClipboard();
  const [activeView, setActiveView] = useSafeState(ADDRESS_FIELD_VIEWS[1]);

  const { data: reverseName } = useTezosDomainNameByAddress(address);

  useEffect(() => {
    if (!isSupported) {
      setActiveView(ADDRESS_FIELD_VIEWS[1]);
    }
  }, [isSupported, setActiveView]);

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
        value={activeView.key === 'hash' ? address : reverseName || ''}
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

        <div className="mb-4 p-1 bg-gray-100 border-2 border-gray-300 rounded" style={{ maxWidth: '60%' }}>
          <QRCode bgColor="#f7fafc" fgColor="#000000" level="Q" style={{ width: '100%' }} value={address} />
        </div>

        {/* <Deposit address={address} /> */}
      </div>
    </>
  );
};

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
});
