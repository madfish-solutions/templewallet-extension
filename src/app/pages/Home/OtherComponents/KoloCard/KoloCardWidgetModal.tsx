import React, { FC, memo, useEffect } from 'react';

import retry from 'async-retry';

import { PageLoader } from 'app/atoms/Loader';
import { PageModal } from 'app/atoms/PageModal';
import { getKoloWidgetUrl } from 'lib/apis/temple';
import { useSafeState } from 'lib/ui/hooks';

interface KoloCardWidgetModalProps {
  opened: boolean;
  onRequestClose: EmptyFn;
}

export const KoloCardWidgetModal: FC<KoloCardWidgetModalProps> = memo(({ opened, onRequestClose }) => {
  const [widgetUrl, setWidgetUrl] = useSafeState<string | null>(null);
  const [loading, setLoading] = useSafeState(false);
  const [error, setError] = useSafeState<string | null>(null);

  useEffect(() => {
    if (!opened) {
      setWidgetUrl(null);
      setError(null);
      return;
    }

    if (widgetUrl || loading || error) return;

    setLoading(true);

    void (async () => {
      try {
        const url = await retry(
          () =>
            getKoloWidgetUrl({
              isEmailLocked: false,
              themeColor: 'light',
              hideFeatures: [],
              isPersist: false
            }),
          { retries: 3 }
        );

        setWidgetUrl(url);
      } catch {
        setError('Failed to load KOLO Card widget. Please try again later.');
      } finally {
        setLoading(false);
      }
    })();
  }, [opened, widgetUrl, loading, error, setLoading, setError, setWidgetUrl]);

  return (
    <PageModal title="Crypto Card" opened={opened} onRequestClose={onRequestClose}>
      <div className="flex flex-col h-full">
        {loading && (
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
            className="w-full flex-grow border-0"
            allow="clipboard-read; clipboard-write; autoplay; payment"
          />
        )}
      </div>
    </PageModal>
  );
});
