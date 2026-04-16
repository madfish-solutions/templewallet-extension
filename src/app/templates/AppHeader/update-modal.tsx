import { ComponentType, useCallback, useEffect, useMemo, useState } from 'react';

import browser, { Storage } from 'webextension-polyfill';

import {
  SHOULD_OPEN_LETS_EXCHANGE_MODAL_STORAGE_KEY,
  SHOULD_SHOW_EARN_ETH_INTRO_MODAL_STORAGE_KEY,
  SHOULD_SHOW_NEW_DAPPS_MODAL_STORAGE_KEY,
  SHOULD_SHOW_V2_INTRO_MODAL_STORAGE_KEY
} from 'lib/constants';
import { fetchManyFromStorage, putToStorage } from 'lib/storage';
import { useInitialSuspenseSWR } from 'lib/swr';

import { EarnEthIntroModal } from './EarnEthIntroModal';
import { LetsExchangeModal } from './LetsExchangeModal';
import { NewDAppsModal } from './NewDAppsModal';
import { UpdateModalProps } from './types';
import { V2IntroductionModal } from './V2IntroductionModal';

type UpdateModalName = 'v2-intro' | 'letsexchange' | 'earn-eth' | 'new-dapps';

type ShouldShowModalStorageKey =
  | typeof SHOULD_SHOW_V2_INTRO_MODAL_STORAGE_KEY
  | typeof SHOULD_OPEN_LETS_EXCHANGE_MODAL_STORAGE_KEY
  | typeof SHOULD_SHOW_EARN_ETH_INTRO_MODAL_STORAGE_KEY
  | typeof SHOULD_SHOW_NEW_DAPPS_MODAL_STORAGE_KEY;

interface UpdateModalRecord {
  storageKey: ShouldShowModalStorageKey;
  Component: ComponentType<UpdateModalProps>;
}

const updateModals: Record<UpdateModalName, UpdateModalRecord> = {
  'v2-intro': { storageKey: SHOULD_SHOW_V2_INTRO_MODAL_STORAGE_KEY, Component: V2IntroductionModal },
  letsexchange: { storageKey: SHOULD_OPEN_LETS_EXCHANGE_MODAL_STORAGE_KEY, Component: LetsExchangeModal },
  'earn-eth': { storageKey: SHOULD_SHOW_EARN_ETH_INTRO_MODAL_STORAGE_KEY, Component: EarnEthIntroModal },
  'new-dapps': { storageKey: SHOULD_SHOW_NEW_DAPPS_MODAL_STORAGE_KEY, Component: NewDAppsModal }
};
const modalsNames = Object.keys(updateModals) as UpdateModalName[];
const storageKeys = Object.values(updateModals).map(modal => modal.storageKey);

const fetchValues = () => fetchManyFromStorage(storageKeys);

let initialValuesPromise: Promise<Partial<Record<ShouldShowModalStorageKey, boolean>>> | null = null;
const getInitialValuesPromise = () => {
  if (!initialValuesPromise) {
    initialValuesPromise = fetchValues();
  }
  return initialValuesPromise;
};

function onStorageChanged(callback: (newValues: Partial<Record<ShouldShowModalStorageKey, boolean>>) => void) {
  const handleChanged = (changes: Storage.StorageAreaOnChangedChangesType) => {
    if (storageKeys.some(key => key in changes)) {
      const newValues: Partial<Record<ShouldShowModalStorageKey, boolean>> = {};
      for (const key of storageKeys) {
        if (key in changes) {
          newValues[key as ShouldShowModalStorageKey] = (changes[key] as Storage.StorageChange).newValue;
        }
      }
      callback(newValues);
    }
  };

  browser.storage.local.onChanged.addListener(handleChanged);

  return () => browser.storage.local.onChanged.removeListener(handleChanged);
}

export const UpdateModal = () => {
  const { data, mutate } = useInitialSuspenseSWR<Partial<Record<ShouldShowModalStorageKey, boolean>>, unknown, string>(
    'update-modals-shown',
    fetchValues,
    getInitialValuesPromise(),
    { revalidateOnMount: true, revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  useEffect(() => onStorageChanged(changes => mutate({ ...data, ...changes })), [data, mutate]);

  const modalToOpen = useMemo(
    () => data && modalsNames.find(modalName => data[updateModals[modalName].storageKey]),
    [data]
  );
  const [modalToShow, setModalToShow] = useState<UpdateModalName | undefined>(modalToOpen);
  useEffect(() => setModalToShow(prevModal => prevModal ?? modalToOpen), [modalToOpen]);

  const handleModalShown = useCallback(() => {
    if (modalToShow) {
      putToStorage(updateModals[modalToShow].storageKey, false);
    }
  }, [modalToShow]);

  const handleCloseModal = useCallback(
    () => setModalToShow(prevModal => (prevModal ? modalsNames[modalsNames.indexOf(prevModal) + 1] : undefined)),
    []
  );

  const Component = modalToShow && updateModals[modalToShow].Component;

  return Component ? <Component onClose={handleCloseModal} onShown={handleModalShown} /> : null;
};
