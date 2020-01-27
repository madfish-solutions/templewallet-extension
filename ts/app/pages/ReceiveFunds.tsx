import * as React from "react";
import classNames from "clsx";
import { Link } from "lib/woozie";
import { QRCode } from "react-qr-svg";
import useThanosContext from "lib/useThanosContext";

const ReceiveFunds: React.FC = () => {
  const { keystore }: any = useThanosContext();
  const address = keystore.publicKeyHash;

  return (
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
        <h1 className="text-3xl mb-4 text-gray-800">Receive Tezos</h1>
        <h4 className="text-base mb-2 text-gray-600 max-w-xs">
          Scan a QR or copy the address from field below
        </h4>
      </div>

      <div className="flex justify-center mt-6">
        <form className="w-full max-w-sm">
          <div className="mb-6 flex justify-center">
            <QRCode
              bgColor="#FFFFFF"
              fgColor="#000000"
              level="Q"
              style={{ width: 256 }}
              value={address}
            />
          </div>
          <div className="mb-6">
            <label
              className="block text-gray-700 text-sm font-bold mb-2"
              htmlFor="address-to"
            >
              Recipient address:
            </label>
            <div
              className={classNames(
                "w-full max-w-full overflow-x-auto",
                "border-4 border-gray-200 bg-gray-100 bg-white",
                "p-2",
                "text-base",
                "rounded"
              )}
            >
              {address}
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default ReceiveFunds;
