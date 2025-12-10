import React, { FC, memo, useEffect } from 'react';

import { PageLoader } from 'app/atoms/Loader';
import { PageModal } from 'app/atoms/PageModal';
import { getKoloWidgetUrl } from 'lib/apis/temple';
import { useSafeState } from 'lib/ui/hooks';

interface KoloCardWidgetModalProps {
  opened: boolean;
  onRequestClose: () => void;
}

export const KoloCardWidgetModal: FC<KoloCardWidgetModalProps> = memo(({ opened, onRequestClose }) => {
  const [widgetUrl, setWidgetUrl] = useSafeState<string | null>(null);
  const [loading, setLoading] = useSafeState(false);
  const [error, setError] = useSafeState<string | null>(null);

  useEffect(() => {
    if (!opened || widgetUrl || loading) return;

    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const url = await getKoloWidgetUrl({
          isEmailLocked: false,
          themeColor: 'light',
          hideFeatures: [],
          isPersist: false
        });

        setWidgetUrl(url);
      } catch {
        setError('Failed to load KOLO Card widget.');
      } finally {
        setLoading(false);
      }
    })();
  }, [opened, widgetUrl, loading, setLoading, setError, setWidgetUrl]);

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
