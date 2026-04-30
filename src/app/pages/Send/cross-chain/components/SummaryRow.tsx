import React, { memo } from 'react';

import { Divider } from 'app/atoms';
import { EXOLIX_PRIVICY_LINK, EXOLIX_TERMS_LINK } from 'app/pages/Buy/CryptoExchange/config';
import { ChartListItem } from 'app/templates/chart-list-item';
import { CROSS_CHAIN_DEFAULT_ETA } from 'lib/cross-chain';
import { T, t } from 'lib/i18n';

interface Props {
  feePercent?: number;
  eta?: string;
}

export const SummaryRow = memo<Props>(({ feePercent, eta = CROSS_CHAIN_DEFAULT_ETA }) => (
  <div className="my-4 px-4 bg-white rounded-8 border-0.5 border-lines">
    <ChartListItem title={t('estimatedTime')}>
      <span className="p-1 text-font-num-12 text-black">{eta}</span>
    </ChartListItem>
    <ChartListItem title={t('fee')} bottomSeparator={false}>
      <span className="p-1 text-font-num-12 text-black">{feePercent != null ? `${feePercent} %` : '—'}</span>
    </ChartListItem>

    <Divider />

    <div className="py-3 px-1 flex flex-col gap-y-2 text-font-small text-grey-1">
      <p>
        <T
          id="byProceedingTermsAgreement"
          substitutions={[
            <a
              key="terms"
              className="text-font-small-bold underline"
              rel="noreferrer"
              href={EXOLIX_TERMS_LINK}
              target="_blank"
            >
              <T id="termsOfUsage" />
            </a>,
            <a
              key="privacy"
              className="text-font-small-bold underline"
              rel="noreferrer"
              href={EXOLIX_PRIVICY_LINK}
              target="_blank"
            >
              <T id="privacyPolicy" />
            </a>
          ]}
        />
      </p>
      <p>
        <T id="tokenExchangePoweredByExolix" />
      </p>
    </div>
  </div>
));
