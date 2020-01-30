import * as React from "react";
import classNames from "clsx";
import { Link } from "lib/woozie";
import { useThanosWalletContext } from "lib/thanos-wallet";

const FIELDS = ["mnemonic", "email", "secret", "pkh", "password"];

const ImportAccountManual: React.FC = () => {
  const { importAccount } = useThanosWalletContext();

  const handleSubmit = React.useCallback(
    (evt: React.FormEvent) => {
      evt.preventDefault();
      const form = evt.target as any;

      const data = {} as any;
      for (const key of FIELDS) {
        data[key] = form.elements[key].value;
      }

      (async () => {
        try {
          await importAccount({
            ...data,
            mnemonic: data.mnemonic.split(" ")
          });
        } catch (err) {
          alert(
            `Oops, error!\n"${err.message}"\nYour data may be invalid, or smth with us;(`
          );
        }
      })();
    },
    [importAccount]
  );

  return (
    <>
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
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="wallet_seed"
            >
              Wallet Seed
            </label>
            <textarea
              name="mnemonic"
              id="wallet_seed"
              required
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
              htmlFor="email"
            >
              Email
            </label>
            <input
              name="email"
              required
              className={classNames(
                "w-full",
                "border-4 border-gray-100 focus:border-gray-200 bg-gray-100 focus:bg-white focus:outline-none",
                "p-2",
                "text-base",
                "rounded overflow-hidden"
              )}
              id="email"
              type="email"
              placeholder="email@example.com"
              spellCheck={false}
            />
            {/* <p className="text-red-500 text-xs italic">
          Please choose a password.
        </p> */}
          </div>

          <div className="mb-6">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="password"
            >
              Password
            </label>
            <input
              name="password"
              required
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
              htmlFor="pkh"
            >
              Public Key Hash
            </label>
            <input
              name="pkh"
              required
              className={classNames(
                "w-full",
                "border-4 border-gray-100 focus:border-gray-200 bg-gray-100 focus:bg-white focus:outline-none",
                "p-2",
                "text-base",
                "rounded overflow-hidden"
              )}
              id="pkh"
              type="text"
              placeholder="tz1..."
            />
            {/* <p className="text-red-500 text-xs italic">
          Please choose a password.
        </p> */}
          </div>

          <div className="mb-6">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="secret"
            >
              Secret / Activation Code
            </label>
            <input
              name="secret"
              required
              className={classNames(
                "w-full",
                "border-4 border-gray-100 focus:border-gray-200 bg-gray-100 focus:bg-white focus:outline-none",
                "p-2",
                "text-base",
                "rounded overflow-hidden"
              )}
              id="secret"
              type="text"
              placeholder="129f0ea64..."
            />
            {/* <p className="text-red-500 text-xs italic">
          Please choose a password.
        </p> */}
          </div>
          <div className="flex items-center justify-between mt-8">
            <button
              className="border-2 border-green-500 hover:border-green-700 bg-green-500 hover:bg-green-700 text-white text-base font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Restore
            </button>
            <div className="flex-1" />
            <Link to="/import/file">
              <button
                className="border-2 border-orange-500 hover:border-orange-700 text-orange-500 hover:text-orange-700 text-base font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
                type="button"
              >
                Import file
              </button>
            </Link>
          </div>
        </form>
      </div>
    </>
  );
};

export default ImportAccountManual;
