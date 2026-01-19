import { useEffect, useMemo } from 'react';

import type { Tabs } from 'webextension-polyfill';

import { browser } from 'lib/browser';
import { useInitialSuspenseSWR } from 'lib/swr';
import { useTempleClient } from 'lib/temple/front';
import { useUpdatableRef } from 'lib/ui/hooks';

function useActiveTab() {
  const { data: activeTab, mutate } = useInitialSuspenseSWR(
    ['browser', 'active-tab'],
    getActiveTab,
    initialActiveTabPromise,
    {
      errorRetryCount: 0,
      revalidateOnMount: false
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

    const onCreated = (tab: Tabs.Tab) => {
      if (tab.active) {
        activeTabRef.current = tab;
      }
      mutate();
    };

    const onRemoved = (tabId: number) => {
      if (tabId === activeTabRef.current?.id) {
        activeTabRef.current = undefined;
        mutate();
      }
    };

    const onReplaced = (_addedTabId: number, removedTabId: number) => {
      if (removedTabId === activeTabRef.current?.id) {
        activeTabRef.current = undefined;
        mutate();
      }
    };

    browser.tabs.onUpdated.addListener(onUpdated);
    browser.tabs.onActivated.addListener(onActivated);
    browser.tabs.onCreated.addListener(onCreated);
    browser.tabs.onRemoved.addListener(onRemoved);
    browser.tabs.onReplaced.addListener(onReplaced);

    return () => {
      browser.tabs.onUpdated.removeListener(onUpdated);
      browser.tabs.onActivated.removeListener(onActivated);
      browser.tabs.onCreated.removeListener(onCreated);
      browser.tabs.onRemoved.removeListener(onRemoved);
    };
  }, [mutate, activeTabRef]);

  return activeTab;
}

async function getActiveTab() {
  return browser.tabs
    .query({
      active: true,
      lastFocusedWindow: true
    })
    .then(tabs => tabs.at(0));
}

const initialActiveTabPromise = getActiveTab();

export function useActiveTabUrlOrigin() {
  const { tabsOrigins } = useTempleClient();
  const tab = useActiveTab();

  return useMemo(() => {
    const rawUrl = tab ? tab.url ?? tabsOrigins[tab.id ?? browser.tabs.TAB_ID_NONE] : undefined;
    const url = rawUrl ? new URL(rawUrl) : null;

    return url?.origin;
  }, [tab, tabsOrigins]);
}
