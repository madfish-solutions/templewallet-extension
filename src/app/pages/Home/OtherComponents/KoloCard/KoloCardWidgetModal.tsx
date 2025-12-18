import React, { memo, useCallback, useEffect, useMemo } from 'react';

import retry from 'async-retry';

import { Button, Divider, IconBase } from 'app/atoms';
import { ActionListItem, ActionListItemProps } from 'app/atoms/ActionListItem';
import { ActionsDropdownPopup } from 'app/atoms/ActionsDropdown';
import { PageLoader } from 'app/atoms/Loader';
import { PageModal } from 'app/atoms/PageModal';
import { ReactComponent as ChatIcon } from 'app/icons/base/chat.svg';
import { ReactComponent as ExitIcon } from 'app/icons/base/exit.svg';
import { ReactComponent as InfoIcon } from 'app/icons/base/info.svg';
import { ReactComponent as MenuCircleIcon } from 'app/icons/base/menu_circle.svg';
import { getKoloWidgetUrl } from 'lib/apis/temple';
import { useSafeState } from 'lib/ui/hooks';
import Popper from 'lib/ui/Popper';

const KOLO_ABOUT_LINK = 'https://docs.templewallet.com/card/';
const KOLO_SUPPORT_URL = 'https://t.me/KoloHelpBot';
const KOLO_MOCK_EMAIL = 'example@gmail.com';

interface KoloCardWidgetModalProps {
  opened: boolean;
  onRequestClose: EmptyFn;
}

export const KoloCardWidgetModal = memo(({ opened, onRequestClose }: KoloCardWidgetModalProps) => {
  const [widgetUrl, setWidgetUrl] = useSafeState<string | null>(null);
  const [loading, setLoading] = useSafeState(false);
  const [error, setError] = useSafeState<string | null>(null);
  const [emailOverride, setEmailOverride] = useSafeState<string | null>(null);
  const [logoutReinitStage, setLogoutReinitStage] = useSafeState<0 | 1 | 2>(0);

  const handleLogout = useCallback(() => {
    // 2-step re-init:
    // stage 1: load once with mock email to drop KOLO session
    // stage 2: auto reload without email, so KOLO can prefill from its account data
    setLogoutReinitStage(1);
    setEmailOverride(KOLO_MOCK_EMAIL);
    setWidgetUrl(null);
    setError(null);
    setLoading(false);
  }, [setLogoutReinitStage, setEmailOverride, setWidgetUrl, setError, setLoading]);

  const dropdownActions = useMemo<KoloActionProps[]>(
    () => [
      {
        key: 'about',
        children: 'About',
        Icon: InfoIcon,
        externalLink: KOLO_ABOUT_LINK
      },
      {
        key: 'support',
        children: 'KOLO Support',
        Icon: ChatIcon,
        externalLink: KOLO_SUPPORT_URL,
        withDividerAfter: true
      },
      {
        key: 'logout',
        children: 'Log out',
        Icon: ExitIcon,
        danger: true,
        className: 'text-error',
        onClick: handleLogout
      }
    ],
    [handleLogout]
  );

  useEffect(() => {
    if (!opened) {
      setWidgetUrl(null);
      setError(null);
      setLoading(false);
      setEmailOverride(null);
      setLogoutReinitStage(0);
      return;
    }

    if (widgetUrl || loading || error) return;

    setLoading(true);

    void (async () => {
      try {
        const url = await retry(
          () =>
            getKoloWidgetUrl({
              email: emailOverride ?? undefined,
              isEmailLocked: false,
              themeColor: 'light',
              hideFeatures: [],
              isPersist: false
            }),
          { retries: 3 }
        );

        setWidgetUrl(url);
        setError(null);
      } catch {
        setError('Failed to load KOLO Card widget. Please try again later.');
      } finally {
        setLoading(false);
      }
    })();
  }, [
    opened,
    widgetUrl,
    loading,
    error,
    emailOverride,
    setLoading,
    setError,
    setWidgetUrl,
    setEmailOverride,
    setLogoutReinitStage
  ]);

  const handleWidgetLoad = useCallback(() => {
    if (logoutReinitStage !== 1) return;

    setLogoutReinitStage(2);
    setEmailOverride(null);
    setWidgetUrl(null);
    setError(null);
  }, [logoutReinitStage, setLogoutReinitStage, setEmailOverride, setWidgetUrl, setError]);

  return (
    <PageModal
      title="Crypto Card"
      opened={opened}
      onRequestClose={onRequestClose}
      titleLeft={opened ? <KoloActionsDropdown actions={dropdownActions} /> : null}
    >
      <div className="flex flex-col h-full">
        {(loading || (logoutReinitStage === 1 && widgetUrl)) && (
          <div className="flex-grow flex items-center justify-center">
            <PageLoader />
          </div>
        )}

        {error && !loading && (
          <div className="flex-grow flex items-center justify-center px-6 text-center text-font-description text-danger">
            {error}
          </div>
        )}

        {!loading && !error && widgetUrl && (
          <iframe
            src={widgetUrl}
            title="KOLO Card widget"
            className={`w-full flex-grow border-0 ${logoutReinitStage === 1 ? 'opacity-0 pointer-events-none' : ''}`}
            allow="clipboard-read; clipboard-write; autoplay; payment"
            onLoad={handleWidgetLoad}
          />
        )}
      </div>
    </PageModal>
  );
});

type KoloActionProps = ActionListItemProps & { key: string };

const KoloActionsDropdown = ({ actions }: { actions: KoloActionProps[] }) => (
  <Popper
    placement="bottom-start"
    strategy="fixed"
    popup={({ opened, setOpened }) => (
      <ActionsDropdownPopup lowering={1} opened={opened} title="Menu" style={{ minWidth: 134 }}>
        {actions.map(action => (
          <div key={action.key}>
            <ActionListItem {...action} setOpened={setOpened} />
            {action.withDividerAfter && <Divider className="bg-grey-4 px-2" />}
          </div>
        ))}
      </ActionsDropdownPopup>
    )}
  >
    {({ ref, toggleOpened }) => (
      <Button ref={ref} onClick={toggleOpened} className="w-6 h-6 flex items-center justify-center">
        <IconBase Icon={MenuCircleIcon} className="text-primary" />
      </Button>
    )}
  </Popper>
);
