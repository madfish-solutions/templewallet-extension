import React, { FC } from 'react';

import { T } from 'lib/i18n/react';

import PageLayout from '../../../../layouts/PageLayout';
//import { InitialStep } from './steps/InitialStep';
import styles from '../../../Buy/Crypto/Exolix/Exolix.module.css';
//import { SellStep } from './steps/SellStep';
import { OrderStatusStep } from './steps/OrderStatusStep';

//TODO: Add analytics

export const AliceBobWithdraw: FC = () => {
  return (
    <PageLayout
      pageTitle={
        <div className="font-medium text-sm">
          <T id="sellTez" />
        </div>
      }
    >
      <div className="pb-8 text-center max-w-sm mx-auto">
        {/*<InitialStep orderInfo={orderInfo} />*/}
        {/*<SellStep />*/}
        <OrderStatusStep />

        <div className="text-gray-700">
          <p className="mt-6">
            <T
              id="privacyAndPolicyLinks"
              substitutions={[
                <T id="next" />,
                <a
                  className={styles['link']}
                  rel="noreferrer"
                  href="https://oval-rhodium-33f.notion.site/End-User-License-Agreement-Abex-Eng-6124123e256d456a83cffc3b2977c4dc"
                  target="_blank"
                >
                  <T id="termsOfUse" />
                </a>,
                <a
                  className={styles['link']}
                  rel="noreferrer"
                  href="https://oval-rhodium-33f.notion.site/Privacy-Policy-Abex-Eng-d70fa7cc134341a3ac4fd04816358b9e"
                  target="_blank"
                >
                  <T id="privacyPolicy" />
                </a>
              ]}
            />
          </p>
          <p className="my-6">
            <T id="warningTopUpServiceMessage" />
          </p>
        </div>
      </div>
    </PageLayout>
  );
};
