import * as React from "react";
import classNames from "clsx";
import PageLayout from "app/layouts/PageLayout";
import RevealMnemonic from "app/templates/RevealMnemonic";

const Settings: React.FC = () => {
  return (
    <PageLayout hasBackAction>
      <div className="py-4">
        <h1
          className={classNames(
            "mb-2",
            "text-2xl font-light text-gray-700 text-center"
          )}
        >
          Settings
        </h1>

        <hr />

        <div className="my-4">
          <h2 className="mb-2 text-xl font-light text-gray-700">
            # Reveal Seed Phrase
          </h2>

          <RevealMnemonic />
        </div>

        {/* <div className="mb-4 flex items-stretch">
          <div
            className="w-1/3 bg-gray-200 overflow-hidden p-4"
            style={{ minHeight: "20rem" }}
          >
            {[
              {
                title: "General",
                linkTo: "/settings/general"
              }
            ].map(({ title, linkTo }, i) => (
              <Link
                key={i}
                to={linkTo}
                className={classNames(
                  "block",
                  "p-2",
                  "flex items-center",
                  "text-base font-semibold",
                  "text-gray-500"
                )}
              >
                {title}
              </Link>
            ))}
          </div>

          <div className="w-2/3"></div>
        </div> */}
      </div>
    </PageLayout>
  );
};

export default Settings;
