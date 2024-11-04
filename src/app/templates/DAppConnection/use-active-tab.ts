import { useEffect, useMemo } from 'react';

import type { Tabs } from 'webextension-polyfill';

import { browser } from 'lib/browser';
import { useTypedSWR } from 'lib/swr';
import { useUpdatableRef } from 'lib/ui/hooks';

function useActiveTab() {
  const { data: activeTab, mutate } = useTypedSWR(
    ['browser', 'active-tab'],
    () =>
      browser.tabs
        .query({
          active: true,
          lastFocusedWindow: true
        })
        .then(tabs => tabs.at(0)),
    {
      suspense: true
    }
  );

  const activeTabRef = useUpdatableRef(activeTab);

  useEffect(() => {
    const onUpdated = (tabId: number, _info: Tabs.OnUpdatedChangeInfoType) => {
      if (tabId === activeTabRef.current?.id) mutate();
    };

    const onActivated = (_info: Tabs.OnActivatedActiveInfoType) => {
      mutate();
    };

    browser.tabs.onUpdated.addListener(onUpdated);

    browser.tabs.onActivated.addListener(onActivated);

    return () => {
      browser.tabs.onUpdated.removeListener(onUpdated);
      browser.tabs.onActivated.removeListener(onActivated);
    };
  }, [mutate, activeTabRef]);

  return activeTab;
}

export function useActiveTabUrlOrigin() {
  const tab = useActiveTab();

  return useMemo(() => {
    const url = tab?.url ? new URL(tab.url) : null;

    return url?.origin;
  }, [tab]);
}
