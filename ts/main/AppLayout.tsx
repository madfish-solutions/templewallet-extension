import * as React from "react";
import classNames from "clsx";
import PageLayout from "layouts/Page";

const App: React.FC = () => {
  return (
    <>
      <PageLayout>
        <div className="flex flex-col items-center text-center">
          <h1 className="text-3xl mb-4 text-gray-800">
            Restore your Account
            <br /> with Seed Phrase
          </h1>
          <h4 className="text-base mb-2 text-gray-600 max-w-xs">
            Enter your secret twelve word phrase here to restore your vault.
          </h4>
        </div>

        <div className="flex justify-center mt-8">
          <form className="w-full max-w-sm">
            <div className="mb-4">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="wallet_seed"
              >
                Wallet Seed
              </label>
              <textarea
                id="wallet_seed"
                placeholder="Separate each word with a single space"
                className={classNames(
                  "w-full h-20",
                  "border-4 border-gray-100 focus:border-gray-200 bg-gray-100 focus:bg-white focus:outline-none",
                  "p-2",
                  "text-base",
                  "rounded overflow-hidden"
                )}
              />
            </div>
            <div className="mb-6">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="password"
              >
                New Password (min 8 chars)
              </label>
              <input
                className={classNames(
                  "w-full",
                  "border-4 border-gray-100 focus:border-gray-200 bg-gray-100 focus:bg-white focus:outline-none",
                  "p-2",
                  "text-base",
                  "rounded overflow-hidden"
                )}
                id="password"
                type="password"
                placeholder="********"
              />
              {/* <p className="text-red-500 text-xs italic">
              Please choose a password.
            </p> */}
            </div>
            <div className="mb-6">
              <label
                className="block text-gray-700 text-sm font-bold mb-2"
                htmlFor="password2"
              >
                Confirm Password
              </label>
              <input
                className={classNames(
                  "w-full",
                  "border-4 border-gray-100 focus:border-gray-200 bg-gray-100 focus:bg-white focus:outline-none",
                  "p-2",
                  "text-base",
                  "rounded overflow-hidden"
                )}
                id="password2"
                type="password"
                placeholder="********"
              />
              {/* <p className="text-red-500 text-xs italic">
              Please choose a password.
            </p> */}
            </div>
            <div className="flex items-center justify-between mt-8">
              <button
                className="bg-green-500 hover:bg-green-700 text-white text-base font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
                type="button"
              >
                Restore
              </button>
            </div>
          </form>
        </div>
      </PageLayout>
      <PageLayout>
        <div className="flex flex-col items-center text-center">
          <h1 className="text-3xl mb-4 text-gray-800">
            Restore your account
            <br />
            with JSON file
          </h1>
          <h4 className="text-base mb-2 text-gray-600 max-w-xs">
            Please, select your file below.
          </h4>
        </div>

        <div className="flex justify-center mt-8">
          <form className="w-full max-w-sm">
            <div className="mb-6 relative w-full">
              <input
                className="cursor-pointer absolute inset-0 block py-2 px-4 opacity-0 pin-r pin-t w-full"
                type="file"
                name="documents[]"
                accept="image/*"
              />
              <div className="text-gray-300 text-lg font-bold py-6 px-6 rounded border-dashed border-4">
              <svg
                width={48}
                height={48}
                viewBox="0 0 24 24"
                aria-labelledby="uploadIconTitle"
                stroke="#e2e8f0"
                strokeWidth={2}
                strokeLinecap="round"
                fill="none"
                color="#e2e8f0"
                className="mx-auto m-4"
              >
                <title>{'Upload'}</title>
                <path d="M12 4v13M7 8l5-5 5 5M20 21H4" />
              </svg>
                <div className="w-full text-center">Select file...</div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-8">
              <button
                className="bg-green-500 hover:bg-green-700 text-white text-base font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
                type="button"
              >
                Restore
              </button>
            </div>
          </form>
        </div>
      </PageLayout>
    </div>
  );
};

export default App;
