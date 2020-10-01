import * as React from "react";
import { T } from "lib/ui/i18n";
import Logo from "app/atoms/Logo";
import SubTitle from "app/atoms/SubTitle";

const About: React.FC = () => (
  <div className="flex flex-col items-center my-8">
    <div className="flex items-center justify-center">
      <Logo imgStyle={{ height: 60 }} />

      <div className="ml-4">
        <T name="appName">
          {(message) => (
            <h4 className="text-2xl text-gray-700 font-semibold">{message}</h4>
          )}
        </T>
        <T
          name="versionLabel"
          substitutions={[
            <span className="font-bold" key="version">
              {process.env.VERSION}
            </span>,
          ]}
        >
          {(message) => (
            <p className="text-sm font-light text-gray-800">{message}</p>
          )}
        </T>
      </div>
    </div>

    <T
      name="madeWithLove"
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
          style={{ color: "#98c630" }}
        >
          Madfish.Solutions
        </a>,
      ]}
    >
      {(message) => (
        <p className="mt-6 text-base font-light text-gray-600">{message}</p>
      )}
    </T>

    <T name="links">{(message) => <SubTitle>{message}</SubTitle>}</T>

    <div className="text-center">
      {[
        {
          key: "website",
          link: "https://thanoswallet.com",
        },
        {
          key: "repo",
          link: "https://github.com/madfish-solutions/thanos-wallet",
        },
        {
          key: "privacyPolicy",
          link: "https://thanoswallet.com/privacy",
        },
        {
          key: "termsOfUse",
          link: "https://thanoswallet.com/terms",
        },
        {
          key: "contact",
          link: "https://thanoswallet.com/contact",
        },
      ].map(({ key, link }) => (
        <T name={key} key={key}>
          {(message) => (
            <a
              key={key}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="block mb-2 text-base text-blue-600 hover:underline"
            >
              {message}
            </a>
          )}
        </T>
      ))}
    </div>
  </div>
);

export default About;
