import * as React from "react";
import classNames from "clsx";
import { QRCode } from "react-qr-svg";

const ReceiveFunds: React.FC = () => (
  <>
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
            value="tz1a9w1SBZzxB3Uc5SkrHxLLSbAcJovKRVjp"
          />
        </div>
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
            readOnly
            id="address-to"
            type="text"
            placeholder="tz1a9w1SBZzxB3Uc5SkrHxLLSbAcJovKRVjp"
          />
        </div>
      </form>
    </div>
  </>
);

export default ReceiveFunds;
