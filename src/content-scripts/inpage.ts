import { v4 as uuid } from 'uuid';
import { EIP1193Provider } from 'viem';

import { templeIcon } from 'content-scripts/constants';
import { TEMPLE_SWITCH_PROVIDER_EVENT } from 'lib/constants';
import { EIP6963ProviderInfo } from 'lib/temple/types';
import { TempleWeb3Provider } from 'temple/evm/web3-provider';

// interface TempleSwitchProviderMessage {
//   type: 'TEMPLE_SWITCH_PROVIDER';
//   rdns?: string;
//   uuid?: string;
//   autoConnect?: boolean;
// }

interface TempleSwitchProviderEvent extends CustomEvent {
  detail: {
    rdns?: string;
    uuid?: string;
    autoConnect?: boolean;
  };
}

declare global {
  interface Window {
    __templeOtherProviders?: EIP6963ProviderInfo[];
    __templeProvidersMapByUuid?: Record<string, EIP1193Provider>;
    __templeProvidersMapByRdns?: Record<string, EIP1193Provider>;
    __templeSelectedOtherUuid?: string;
    __templeSelectedOtherRdns?: string;
    __templeForwardTarget?: EIP1193Provider;
    ethereum?: EIP1193Provider;
  }
}

const provider = new TempleWeb3Provider();

setGlobalProvider(provider);

const info: EIP6963ProviderInfo = {
  uuid: uuid(),
  name: 'Temple Wallet',
  icon: templeIcon,
  rdns: 'com.templewallet'
};

const otherProviders: EIP6963ProviderInfo[] = [];
const providersMapByUuid: Record<string, EIP1193Provider> = {};
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

  console.log('detail', detail)
  if (announced.name === info.name && announced.rdns === info.rdns) return;
  if (!otherProviders.find(provider => provider.uuid === announced.uuid)) {
    otherProviders.push({ uuid: announced.uuid, name: announced.name, icon: announced.icon, rdns: announced.rdns });
    window.__templeOtherProviders = otherProviders.slice();
  }
  if (detail?.provider) {
    if (announced.uuid) providersMapByUuid[announced.uuid] = detail.provider;
    if (announced.rdns) providersMapByRdns[announced.rdns] = detail.provider;
    window.__templeProvidersMapByUuid = providersMapByUuid;
    window.__templeProvidersMapByRdns = providersMapByRdns;
  }
}

window.addEventListener('eip6963:requestProvider', announceProvider);
window.addEventListener('eip6963:announceProvider', handleAnnounceProvider);

// // Handle switch request from content-script
// window.addEventListener('message', async (evt: MessageEvent<TempleSwitchProviderMessage>) => {
//   if (evt.source !== window) return;
//   const data = evt.data;
//   if (data?.type === 'TEMPLE_SWITCH_PROVIDER') {
//     console.log('here TEMPLE_SWITCH_PROVIDER MESSAGE')
//     const { rdns, uuid, autoConnect } = data;
//     const byUuid = uuid && window.__templeProvidersMapByUuid?.[uuid];
//     const byRdns = rdns && window.__templeProvidersMapByRdns?.[rdns];
//     const target = byUuid || byRdns || null;
//
//     if (target) {
//       try {
//         window.__templeSelectedOtherUuid = uuid;
//         window.__templeSelectedOtherRdns = rdns;
//         window.__templeForwardTarget = target;
//         if (autoConnect) {
//           try {
//             await target.request({ method: 'eth_requestAccounts' });
//           } catch (e1) {
//             console.warn('target.request failed', e1);
//             try {
//               await window.ethereum?.request?.({ method: 'eth_requestAccounts' });
//             } catch (e2) {
//               console.error('window.ethereum.request failed', e2);
//             }
//           }
//         }
//       } catch (e) {
//         /* empty */
//       }
//     }
//   }
// });

document.addEventListener(TEMPLE_SWITCH_PROVIDER_EVENT, async (evt: Event) => {
  const customEvent = evt as TempleSwitchProviderEvent;
  const data = customEvent?.detail || {};
  const { rdns, uuid, autoConnect } = data;
  const byUuid = uuid && window.__templeProvidersMapByUuid?.[uuid];
  const byRdns = rdns && window.__templeProvidersMapByRdns?.[rdns];
  const target = byUuid || byRdns || null;

  if (target) {
    try {
      window.__templeSelectedOtherUuid = uuid;
      window.__templeSelectedOtherRdns = rdns;
      window.__templeForwardTarget = target;
      if (autoConnect) {
        try {
          await target.request({ method: 'eth_requestAccounts' });
        } catch (err) {}
      }
    } catch (e) {}
  }
});

announceProvider();

function setGlobalProvider(providerInstance: EIP1193Provider) {
  try {
    window.ethereum = providerInstance;
    window.dispatchEvent(new Event('ethereum#initialized'));
  } catch (e) {
    console.error(e);
  }
}

function announceProvider() {
  window.dispatchEvent(
    new CustomEvent('eip6963:announceProvider', {
      detail: Object.freeze({ info, provider })
    })
  );
}
