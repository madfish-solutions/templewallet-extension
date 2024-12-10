import React, { memo } from 'react';

import clsx from 'clsx';

import { T, t } from 'lib/i18n';

import { Section } from '../section';

export const Achievements = memo(() => (
  <Section title={t('achievements')}>
    <div
      className={clsx(
        'bg-gray-100 rounded-2xl flex flex-col justify-center items-center text-center gap-1',
        'text-sm leading-tight text-gray-500 font-medium'
      )}
      style={{ padding: '50px 0' }}
    >
      <p>🚧</p>
      <p>
        <T id="comingSoon" />
      </p>
    </div>
  </Section>
));
