import React, { ChangeEvent, memo, useEffect, useMemo, useState } from 'react';

import { PageTitle } from 'app/atoms';
import { Button } from 'app/atoms/Button';
import { FormField } from 'app/atoms/FormField';
import { PageLoader } from 'app/atoms/Loader';
import { Logo } from 'app/atoms/Logo';
import PageLayout from 'app/layouts/PageLayout';
import { getKoloCryptoAddress, getKoloWidgetUrl } from 'lib/apis/temple';
import { useLocalStorage } from 'lib/ui/local-storage';

const DEFAULT_CUSTOMER_COLORS = {
  BrandColor: '',
  ButtonPimary: '',
  ButtonPimaryDisabled: '',
  ButtonPimaryPressed: '',
  TextButton: '',
  TextDisabledButton: '',
  BgPrimary: '',
  BgSecondary: '',
  BgTertiary: ''
};

type CustomerColorsState = typeof DEFAULT_CUSTOMER_COLORS;

export const KoloCardPage = memo(() => {
  const [widgetUrl, setWidgetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [topUpAddress, setTopUpAddress] = useState<string | null>(null);
  const [topUpMemo, setTopUpMemo] = useState<string | null>(null);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [topUpError, setTopUpError] = useState<string | null>(null);

  const [customerColors, setCustomerColors] = useLocalStorage<CustomerColorsState>(
    'kolo-card-customer-colors',
    DEFAULT_CUSTOMER_COLORS
  );
  const [customerColorsDraft, setCustomerColorsDraft] = useState<CustomerColorsState>(customerColors);

  const hasCustomColors = useMemo(
    () => Object.values(customerColors).some(value => Boolean(value && value.trim().length > 0)),
    [customerColors]
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const url = await getKoloWidgetUrl({
          isEmailLocked: false,
          themeColor: 'light',
          customerColors: hasCustomColors ? customerColors : undefined,
          hideFeatures: [],
          isPersist: false
        });

        if (!cancelled) {
          setWidgetUrl(url);
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load KOLO Card widget.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasCustomColors, customerColors]);

  const handleCustomerColorChange =
    (key: keyof CustomerColorsState) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;

      setCustomerColorsDraft(prev => ({
        ...prev,
        [key]: value
      }));
    };

  const handleResetCustomerColors = () => {
    setCustomerColorsDraft(DEFAULT_CUSTOMER_COLORS);
  };

  const handleApplyCustomerColors = () => {
    setCustomerColors(customerColorsDraft);
  };

  const handleFetchTopUpAddress = async () => {
    try {
      setTopUpLoading(true);
      setTopUpError(null);

      const { address, memo } = await getKoloCryptoAddress('example@gmail.com', 'eth');

      setTopUpAddress(address);
      setTopUpMemo(memo ?? null);
    } catch (err: any) {
      setTopUpError(err?.response?.data?.error ?? 'Failed to fetch top-up address.');
      setTopUpAddress(null);
      setTopUpMemo(null);
    } finally {
      setTopUpLoading(false);
    }
  };

  return (
    <PageLayout pageTitle={<PageTitle title="KOLO Card" />}>
      <div className="pt-2 pb-6">
        <div className="w-full max-w-sm mx-auto flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-text">
              <Logo type="icon" size={16} />
            </div>
            <span className="text-font-medium-bold">KOLO Card</span>
          </div>

          {loading && <PageLoader stretch />}

          {error && !loading && <span className="text-font-description text-danger">{error}</span>}

          {!loading && !error && widgetUrl && (
            <div className="rounded-12 overflow-hidden border border-lines">
              <iframe
                src={widgetUrl}
                title="KOLO Card widget"
                style={{ width: '100%', height: 720, border: 'none' }}
                allow="clipboard-read; clipboard-write; autoplay; payment"
              />
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3">
            <span className="text-font-small-bold text-grey-1">Designer playground: KOLO colors</span>

            <FormField
              label="BrandColor"
              type="text"
              value={customerColorsDraft.BrandColor}
              onChange={handleCustomerColorChange('BrandColor')}
              placeholder="#FFD600"
              smallPaddings
            />

            <FormField
              label="ButtonPimary"
              type="text"
              value={customerColorsDraft.ButtonPimary}
              onChange={handleCustomerColorChange('ButtonPimary')}
              placeholder="#FFD600"
              smallPaddings
            />

            <FormField
              label="ButtonPimaryDisabled"
              type="text"
              value={customerColorsDraft.ButtonPimaryDisabled}
              onChange={handleCustomerColorChange('ButtonPimaryDisabled')}
              placeholder="#0E0E0C"
              smallPaddings
            />

            <FormField
              label="TextButton"
              type="text"
              value={customerColorsDraft.TextButton}
              onChange={handleCustomerColorChange('TextButton')}
              placeholder="#000000"
              smallPaddings
            />

            <FormField
              label="TextDisabledButton"
              type="text"
              value={customerColorsDraft.TextDisabledButton}
              onChange={handleCustomerColorChange('TextDisabledButton')}
              placeholder="#686866"
              smallPaddings
            />

            <FormField
              label="BgPrimary"
              type="text"
              value={customerColorsDraft.BgPrimary}
              onChange={handleCustomerColorChange('BgPrimary')}
              placeholder="#000000"
              smallPaddings
            />

            <FormField
              label="BgSecondary"
              type="text"
              value={customerColorsDraft.BgSecondary}
              onChange={handleCustomerColorChange('BgSecondary')}
              placeholder="#181816"
              smallPaddings
            />

            <FormField
              label="BgTertiary"
              type="text"
              value={customerColorsDraft.BgTertiary}
              onChange={handleCustomerColorChange('BgTertiary')}
              placeholder="#0F0F10"
              smallPaddings
            />

            <div className="flex gap-2">
              <Button onClick={handleApplyCustomerColors}>Apply</Button>
              <Button onClick={handleResetCustomerColors}>Reset to defaults</Button>
            </div>
          </div>

          {/*<div className="mt-4 flex flex-col gap-2">*/}
          {/*  <Button disabled={topUpLoading} onClick={handleFetchTopUpAddress}>*/}
          {/*    {topUpLoading ? 'Fetching top-up address...' : 'Get crypto top-up address'}*/}
          {/*  </Button>*/}

          {/*  {topUpError && <span className="text-font-small text-danger">{topUpError}</span>}*/}

          {/*  {topUpAddress && (*/}
          {/*    <div className="mt-2 flex flex-col gap-2">*/}
          {/*      <span>{topUpAddress}</span>*/}

          {/*      {topUpMemo && <span className="text-font-small break-all">{topUpMemo}</span>}*/}
          {/*    </div>*/}
          {/*  )}*/}
          {/*</div>*/}
        </div>
      </div>
    </PageLayout>
  );
});
