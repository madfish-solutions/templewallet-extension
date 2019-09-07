import * as React from "react";
import classNames from "clsx";
import PageLayout from "layouts/Page";

const App: React.FC = () => {
  return (
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
  );
};

export default App;
