import { v4 as uuid } from 'uuid';
import { EIP1193Provider } from 'viem';

import { TEMPLE_ICON } from 'content-scripts/constants';
import { TEMPLE_SET_DEFAULT_PROVIDER_MSG_TYPE } from 'lib/constants';
import { EIP6963ProviderInfo } from 'lib/temple/types';
import { TempleWeb3Provider } from 'temple/evm/web3-provider';

declare global {
  interface Window {
    __templeOtherProviders?: EIP6963ProviderInfo[];
    __templeProvidersMapByRdns?: Record<string, EIP1193Provider>;
    __templeForwardTarget?: EIP1193Provider;
    ethereum?: EIP1193Provider;
    temple?: TempleWeb3Provider;
    templeWalletRouter?: {
      lastInjectedProvider?: EIP1193Provider;
      templeOnWindowEthereum: boolean;
      setDefaultProvider: (templeOnWindowEthereum: boolean) => void;
      addProvider: (provider: EIP1193Provider) => void;
    };
  }
}

const info: EIP6963ProviderInfo = {
  uuid: uuid(),
  name: 'Temple Wallet',
  icon: TEMPLE_ICON,
  rdns: 'com.templewallet'
};

function announceProvider() {
  globalThis.dispatchEvent(
    new CustomEvent('eip6963:announceProvider', {
      detail: Object.freeze({ info, provider: eip6963TempleProvider })
    })
  );
}

const defaultTempleProvider = new TempleWeb3Provider();
defaultTempleProvider.initializeAccountsList();
const eip6963TempleProvider = new TempleWeb3Provider(true);
eip6963TempleProvider.initializeAccountsList();

const existingEthereum = window.ethereum;

const walletRouter = {
  lastInjectedProvider: existingEthereum,
  templeOnWindowEthereum: false,
  setDefaultProvider(templeOnWindowEthereum: boolean) {
    walletRouter.templeOnWindowEthereum = templeOnWindowEthereum;
  },
  addProvider(provider: EIP1193Provider) {
    if (defaultTempleProvider !== provider) {
      walletRouter.lastInjectedProvider = provider;
    }
  }
};

const isMetaMaskGetter = { get: () => walletRouter.templeOnWindowEthereum };
Object.defineProperty(defaultTempleProvider, 'isMetaMask', isMetaMaskGetter);
Object.defineProperty(eip6963TempleProvider, 'isMetaMask', isMetaMaskGetter);

announceProvider();

try {
  Object.defineProperty(window, 'temple', {
    value: defaultTempleProvider,
    configurable: false
  });
} catch {
  window.temple = defaultTempleProvider;
}

try {
  Object.defineProperty(window, 'templeWalletRouter', {
    value: walletRouter,
    configurable: false
  });
} catch {
  window.templeWalletRouter = walletRouter;
}

try {
  Object.defineProperty(window, 'ethereum', {
    get() {
      if (walletRouter.templeOnWindowEthereum) {
        return defaultTempleProvider;
      }
      return walletRouter.lastInjectedProvider;
    },
    set(newProvider) {
      walletRouter.addProvider(newProvider);
    },
    configurable: false
  });
} catch {
  try {
    window.ethereum = defaultTempleProvider;
  } catch {}
}

globalThis.dispatchEvent(new Event('ethereum#initialized'));

window.addEventListener('message', evt => {
  if (evt.source !== window) return;
  if (evt.data?.type === TEMPLE_SET_DEFAULT_PROVIDER_MSG_TYPE) {
    window.templeWalletRouter?.setDefaultProvider(evt.data.templeOnWindowEthereum);
  }
});

const otherProviders: EIP6963ProviderInfo[] = [];
const providersMapByRdns: Record<string, EIP1193Provider> = {};

interface EIP6963AnnounceProviderEvent extends CustomEvent {
  detail: {
    info: EIP6963ProviderInfo;
    provider: EIP1193Provider;
  };
}

function handleAnnounceProvider(evt: Event) {
  const customEvent = evt as EIP6963AnnounceProviderEvent;
  const detail = customEvent?.detail;
  const announced: EIP6963ProviderInfo | undefined = detail?.info;
  if (!announced) return;

  if (announced.name === info.name && announced.rdns === info.rdns) return;
  if (!otherProviders.some(provider => provider.uuid === announced.uuid)) {
    otherProviders.push({ uuid: announced.uuid, name: announced.name, icon: announced.icon, rdns: announced.rdns });
    window.__templeOtherProviders = otherProviders.slice();
  }
  if (detail?.provider) {
    if (announced.rdns) providersMapByRdns[announced.rdns] = detail.provider;
    window.__templeProvidersMapByRdns = providersMapByRdns;
    window.templeWalletRouter?.addProvider(detail.provider);
  }
}

globalThis.addEventListener('eip6963:requestProvider', announceProvider);
globalThis.addEventListener('eip6963:announceProvider', handleAnnounceProvider);
globalThis.dispatchEvent(new Event('eip6963:requestProvider'));
