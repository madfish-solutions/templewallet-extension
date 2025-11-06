import { useRef } from 'react';

import constate from 'constate';

import { useAccountAddressForEvm, useAccountAddressForTezos } from 'temple/front';

import { useActiveTabUrlOrigin } from './use-active-tab';

export const [DAppConnectionRefsProvider, useDAppConnectionRefs] = constate(() => {
  const tezAddress = useAccountAddressForTezos();
  const evmAddress = useAccountAddressForEvm();
  const activeTabOrigin = useActiveTabUrlOrigin();
  const prevTezAddressRef = useRef(tezAddress);
  const prevEvmAddressRef = useRef(evmAddress);
  const prevActiveTabOriginRef = useRef(activeTabOrigin);

  return { prevTezAddressRef, prevEvmAddressRef, prevActiveTabOriginRef };
});
