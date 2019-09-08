import * as React from "react";
import classNames from "clsx";
import { Link } from "react-router-dom";

const TransferFunds: React.FC = () => (
  <>
    <div className="bg-gray-100 px-8 py-4 -mt-8 -mx-8 mb-4 flex items-center">
      <Link to="/account">
        <button
          className="border-2 border-gray-600 hover:border-gray-700 text-gray-600 hover:text-gray-700 text-sm font-semibold py-1 px-4 rounded focus:outline-none focus:shadow-outline"
          type="button"
        >
          Back
        </button>
      </Link>
    </div>

    <div className="flex flex-col items-center text-center">
      <h1 className="text-3xl mb-4 text-gray-800">Transfer Tezos</h1>
      <h4 className="text-base mb-2 text-gray-600 max-w-xs">
        Please, provide the recipient address and amount to be sent
      </h4>
    </div>

    <div className="flex justify-center mt-8">
      <form className="w-full max-w-sm">
        <div className="mb-6">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="address-to"
          >
            Recipient address:
          </label>
          <input
            className={classNames(
              "w-full",
              "border-4 border-gray-100 focus:border-gray-200 bg-gray-100 focus:bg-white focus:outline-none",
              "p-2",
              "text-base",
              "rounded overflow-hidden"
            )}
            id="address-to"
            type="text"
            placeholder="tz1a9w1SBZzxB3Uc5SkrHxLLSbAcJovKRVjp"
          />
        </div>
        <div className="mb-6">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="address-to"
          >
            Amount:
          </label>
          <input
            className={classNames(
              "w-full",
              "border-4 border-gray-100 focus:border-gray-200 bg-gray-100 focus:bg-white focus:outline-none",
              "p-2",
              "text-base",
              "rounded overflow-hidden"
            )}
            id="address-to"
            type="number"
            placeholder="15.00"
          />
        </div>
        <div className="mb-6">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="address-to"
          >
            Transaction fee:
          </label>
          <input
            className={classNames(
              "w-full",
              "border-4 border-gray-100 focus:border-gray-200 bg-gray-100 focus:bg-white focus:outline-none",
              "p-2",
              "text-base",
              "rounded overflow-hidden"
            )}
            id="address-to"
            type="number"
            placeholder="15000"
          />
        </div>
        <div className="flex items-center justify-between mt-8">
          <button
            className="bg-green-500 hover:bg-green-700 text-white text-base font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
            type="button"
          >
            Send transaction
          </button>
        </div>
      </form>
    </div>
  </>
);

export default TransferFunds;
