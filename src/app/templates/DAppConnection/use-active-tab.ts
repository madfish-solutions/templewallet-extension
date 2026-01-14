import { useEffect, useMemo, useState } from 'react';

import type { Tabs } from 'webextension-polyfill';

import { browser } from 'lib/browser';
import { useTempleClient } from 'lib/temple/front';

function useActiveTab() {
  const [activeTab, setActiveTab] = useState<Tabs.Tab>();

  useEffect(() => {
    const update = async () => {
      const tabs = await browser.tabs.query({
        active: true,
        lastFocusedWindow: true
      });
      setActiveTab(tabs.at(0));
    };

    update();

    browser.tabs.onUpdated.addListener(update);
    browser.tabs.onActivated.addListener(update);
    browser.tabs.onCreated.addListener(update);
    browser.tabs.onRemoved.addListener(update);
    browser.tabs.onReplaced.addListener(update);

    return () => {
      browser.tabs.onUpdated.removeListener(update);
      browser.tabs.onActivated.removeListener(update);
      browser.tabs.onCreated.removeListener(update);
      browser.tabs.onRemoved.removeListener(update);
      browser.tabs.onReplaced.removeListener(update);
    };
  }, []);

  return activeTab;
}

export function useActiveTabUrlOrigin() {
  const { tabsOrigins } = useTempleClient();
  const tab = useActiveTab();

  return useMemo(() => {
    if (!tab) return undefined;
    const rawUrl = tab.url ?? tabsOrigins[tab.id ?? browser.tabs.TAB_ID_NONE];

    return rawUrl ? new URL(rawUrl).origin : undefined;
  }, [tab, tabsOrigins]);
}
