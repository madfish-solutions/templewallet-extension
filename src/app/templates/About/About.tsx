import React, { FC, useCallback, useState } from 'react';

import { FormSecondaryButton } from 'app/atoms';
import { Anchor } from 'app/atoms/Anchor';
import Logo from 'app/atoms/Logo';
import SubTitle from 'app/atoms/SubTitle';
import { getGoogleAuthToken, readGoogleDriveFile, writeGoogleDriveFile } from 'lib/apis/google';
import { EnvVars } from 'lib/env';
import { TID, T } from 'lib/i18n';
/* import { intercom } from 'lib/temple/front/client';
import { TempleMessageType, TempleNotification } from 'lib/temple/types'; */

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
    link: 'https://templewallet.com/privacy',
    testID: AboutSelectors.privacyPolicyLink
  },
  {
    key: 'termsOfUse',
    link: 'https://templewallet.com/terms',
    testID: AboutSelectors.termsOfUseLink
  },
  {
    key: 'contact',
    link: 'https://templewallet.com/contact',
    testID: AboutSelectors.contactLink
  }
];

const testFile = 'bloatware.txt';

const About: FC = () => {
  const [authToken, setAuthToken] = useState<string>();

  const authorize = useCallback(async () => {
    try {
      setAuthToken(await getGoogleAuthToken());
    } catch (e) {
      console.error('Caught authorization error:', e);
    }
  }, []);

  const readTestFile = useCallback(async () => {
    try {
      if (!authToken) {
        throw new Error('No auth token');
      }

      const content = await readGoogleDriveFile(testFile, authToken);
      console.log(`Successfully read ${testFile}:`, content);
    } catch (e) {
      console.error(e);
    }
  }, [authToken]);

  const writeSmthToTestFile = useCallback(async () => {
    const bloatwareAlphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const bloatwareContent = Array(128)
      .fill('')
      .map(() => bloatwareAlphabet[Math.floor(Math.random() * bloatwareAlphabet.length)])
      .join('');
    console.log(`Going to write ${bloatwareContent} to ${testFile}`);
    try {
      if (!authToken) {
        throw new Error('No auth token');
      }

      const { id, name } = await writeGoogleDriveFile(testFile, bloatwareContent, authToken, 'text/plain');
      console.log(`Successfully wrote ${name} (${id})`);
    } catch (e) {
      console.error(e);
    }
  }, [authToken]);

  /* useEffect(() => {
    if (canUseChromeAuthorization) {
      return;
    }

    return intercom.subscribe((msg: TempleNotification) => {
      switch (msg.type) {
        case TempleMessageType.BackupRead:
          console.log(`Successfully read ${testFile}:`, msg.content);
          break;
        case TempleMessageType.BackupWritten:
          console.log(`Successfully wrote ${testFile}`);
          break;
      }
    });
  }, [canUseChromeAuthorization]); */

  return (
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

      {/* canUseChromeAuthorization && (
        <div>
          {authToken ? (
            <>
              <FormSecondaryButton small onClick={readTestFile}>
                Read test file
              </FormSecondaryButton>
              <FormSecondaryButton small onClick={writeSmthToTestFile}>
                Write something to test file
              </FormSecondaryButton>
            </>
          ) : (
            <FormSecondaryButton small onClick={getIdentity}>
              Get identity
            </FormSecondaryButton>
          )}
        </div>
      )}
      {!canUseChromeAuthorization && (
        <div>
          <Anchor href="http://localhost:3000/google-drive-backup/read">Read test file</Anchor>
          <Anchor href="http://localhost:3000/google-drive-backup/write">Write something to test file</Anchor>
        </div>
      ) */}
      <div>
        {authToken ? (
          <>
            <FormSecondaryButton small onClick={readTestFile}>
              Read test file
            </FormSecondaryButton>
            <FormSecondaryButton small onClick={writeSmthToTestFile}>
              Write something to test file
            </FormSecondaryButton>
          </>
        ) : (
          <FormSecondaryButton small onClick={authorize}>
            Authorize
          </FormSecondaryButton>
        )}
      </div>
    </div>
  );
};

export default About;
