import React, { FC } from 'react';

import { Anchor } from 'app/atoms/Anchor';
import Logo from 'app/atoms/Logo';
import SubTitle from 'app/atoms/SubTitle';
import { PRIVACY_POLICY_URL, TERMS_OF_USE_URL } from 'lib/constants';
import { EnvVars } from 'lib/env';
import { TID, T } from 'lib/i18n';

import { AboutSelectors } from './About.selectors';

const LINKS: {
  key: TID;
  link: string;
  testID: string;
}[] = [
  {
    key: 'website',
    link: 'https://templewallet.com',
    testID: AboutSelectors.websiteLink
  },
  {
    key: 'repo',
    link: 'https://github.com/madfish-solutions/templewallet-extension',
    testID: AboutSelectors.repoLink
  },
  {
    key: 'privacyPolicy',
    link: PRIVACY_POLICY_URL,
    testID: AboutSelectors.privacyPolicyLink
  },
  {
    key: 'termsOfUse',
    link: TERMS_OF_USE_URL,
    testID: AboutSelectors.termsOfUseLink
  },
  {
    key: 'contact',
    link: 'https://templewallet.com/contact',
    testID: AboutSelectors.contactLink
  }
];

const About: FC = () => (
  <div className="flex flex-col items-center my-8">
    <div className="flex items-center justify-center">
      <Logo style={{ height: 60 }} />

      <div className="ml-4">
        <h4 className="text-xl font-semibold text-gray-700">
          <T id="appName" />
        </h4>

        <p className="text-sm font-light text-gray-800">
          <T
            id="versionLabel"
            substitutions={[
              <span className="font-bold" key="version">
                {process.env.VERSION}
              </span>
            ]}
          />
        </p>
        <p className="text-sm font-light text-gray-800 max-w-xs">
          <T
            id="branchName"
            substitutions={[
              <span className="font-bold" key="branch">
                {EnvVars.TEMPLE_WALLET_DEVELOPMENT_BRANCH_NAME}
              </span>
            ]}
          />
        </p>
      </div>
    </div>

    <p className="mt-6 text-base font-light text-gray-600">
      <T
        id="madeWithLove"
        substitutions={[
          <span role="img" aria-label="love" key="heart">
            ❤️
          </span>,
          <Anchor
            href="https://madfish.solutions"
            key="link"
            className="font-normal hover:underline"
            style={{ color: '#98c630' }}
            testID={AboutSelectors.madFishLink}
          >
            Madfish.Solutions
          </Anchor>
        ]}
      />
    </p>

    <SubTitle className="mt-10 mb-2">
      <T id="links" />
    </SubTitle>

    <div className="text-center">
      {LINKS.map(({ key, link, testID }) => (
        <Anchor key={key} href={link} className="block mb-2 text-base text-blue-600 hover:underline" testID={testID}>
          <T id={key} />
        </Anchor>
      ))}
    </div>
  </div>
);

export default About;
