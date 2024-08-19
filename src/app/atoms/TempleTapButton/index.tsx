import React, { memo } from 'react';

import { Anchor } from 'app/atoms/Anchor';
import { useAppEnv } from 'app/env';

import TempleTapFullpageBg from './assets/temple-tap-fullpage-bg.png';
import TempleTapPopupBg from './assets/temple-tap-popup-bg.png';
import { TempleTapSelectors } from './selectors';
import styles from './styles.module.css';

export const TempleTapButton = memo(() => {
  const { popup } = useAppEnv();

  return (
    <Anchor
      className="flex items-center justify-center mr-5 relative"
      href="https://t.me/temple_tap_bot"
      testID={TempleTapSelectors.templeTapButtonPress}
      treatAsButton
    >
      <div className="overflow-hidden rounded relative">
        <img alt="temple tap bg" className="w-auto h-7" src={popup ? TempleTapPopupBg : TempleTapFullpageBg} />
        <div className={styles.goldShine} />
      </div>

      <div className={styles.pickaxe} />
    </Anchor>
  );
});
