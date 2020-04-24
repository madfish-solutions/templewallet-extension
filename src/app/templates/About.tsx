import * as React from "react";
import Logo from "app/atoms/Logo";
import SubTitle from "app/atoms/SubTitle";

const About: React.FC = () => {
  return (
    <div className="flex flex-col items-center my-8">
      <div className="flex items-center justify-center">
        <Logo imgStyle={{ height: 60 }} />

        <div className="ml-4">
          <h4 className="text-2xl text-gray-700 font-semibold">
            Thanos Wallet
          </h4>
          <p className="text-sm font-light text-gray-800">
            version: <span className="font-bold">{process.env.VERSION}</span>
          </p>
        </div>
      </div>

      <p className="mt-6 text-base font-light text-gray-600">
        Made with{" "}
        <span role="img" aria-label="Madfish Solutions">
          ❤️
        </span>{" "}
        by{" "}
        <a
          href="https://madfish.solutions"
          target="_blank"
          rel="noopener noreferrer"
          className="font-normal underline"
          style={{ color: "#98c630" }}
        >
          Madfish.Solutions
        </a>
      </p>

      <SubTitle>Links</SubTitle>

      <div className="text-center">
        {[
          {
            key: "website",
            name: "Website",
            link: "https://thanoswallet.com",
          },
          {
            key: "repo",
            name: "Repository",
            link: "https://github.com/madfish-solutions/thanos-wallet",
          },
          {
            key: "privacy",
            name: "Privacy Policy",
            link: "https://thanoswallet.com/privacy",
          },
          {
            key: "terms",
            name: "Terms of Use",
            link: "https://thanoswallet.com/terms",
          },
          {
            key: "contact",
            name: "Contact",
            link: "https://thanoswallet.com/contact",
          },
        ].map(({ key, name, link }) => (
          <a
            key={key}
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="block mb-2 text-base text-blue-600"
          >
            {name}
          </a>
        ))}
      </div>
    </div>
  );
};

export default About;
