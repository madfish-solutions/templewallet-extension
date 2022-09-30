import React, { FC } from 'react';

import Logo from 'app/atoms/Logo';
import SubTitle from 'app/atoms/SubTitle';
import { TID, T } from 'lib/i18n/react';

const LINKS: {
  key: TID;
  link: string;
}[] = [
  {
    key: 'website',
    link: 'https://templewallet.com'
  },
  {
    key: 'repo',
    link: 'https://github.com/madfish-solutions/templewallet-extension'
  },
  {
    key: 'privacyPolicy',
    link: 'https://templewallet.com/privacy'
  },
  {
    key: 'termsOfUse',
    link: 'https://templewallet.com/terms'
  },
  {
    key: 'contact',
    link: 'https://templewallet.com/contact'
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
      </div>
    </div>

    <p className="mt-6 text-base font-light text-gray-600">
      <T
        id="madeWithLove"
        substitutions={[
          <span role="img" aria-label="love" key="heart">
            ❤️
          </span>,
          <a
            href="https://madfish.solutions"
            key="link"
            target="_blank"
            rel="noopener noreferrer"
            className="font-normal hover:underline"
            style={{ color: '#98c630' }}
          >
            Madfish.Solutions
          </a>
        ]}
      />
    </p>

    <SubTitle className="mt-10 mb-2">
      <T id="links" />
    </SubTitle>

    <div className="text-center">
      {LINKS.map(({ key, link }) => (
        <a
          key={key}
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="block mb-2 text-base text-blue-600 hover:underline"
        >
          <T id={key} />
        </a>
      ))}
    </div>
  </div>
);

export default About;
