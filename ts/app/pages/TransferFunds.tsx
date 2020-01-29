import * as React from "react";
import classNames from "clsx";
import { Link } from "lib/woozie";
import { useThanosWalletContext } from "lib/thanos-wallet";

const FIELDS = ["to", "amount", "fee"];

const TransferFunds: React.FC = () => {
  const { transfer } = useThanosWalletContext();
  const [sending, setSending] = React.useState(false);

  const handleSubmit = (evt: React.FormEvent) => {
    evt.preventDefault();
    const form = evt.target as any;

    const data = {} as any;
    for (const key of FIELDS) {
      data[key] = form.elements[key].value;
    }

    (async () => {
      if (sending) return;
      try {
        setSending(true);
        const tx = await transfer(
          data.to,
          data.amount
          // data.fee
        );

        alert(`DONE! Transaction:\n${JSON.stringify(tx)}`);
        form.reset();
        setSending(false);
      } catch (err) {
        alert(
          `Oops, error!\n"${err.message}"\nYour data may be invalid, or smth with us;(`
        );
        setSending(false);
      }
    })();
  };

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
        <h1 className="text-3xl mb-4 text-gray-800">Transfer Tezos</h1>
        <h4 className="text-base mb-2 text-gray-600 max-w-xs">
          Please, provide the recipient address and amount to be sent
        </h4>
      </div>

      {(() => {
        // if (activating) {
        //   return (
        //     <div className="w-full h-48 flex items-center justify-center">
        //       <div className="text-sm font-medium text-gray-500 uppercase">
        //         Loading activation status...
        //       </div>
        //     </div>
        //   );
        // }

        // if (!activated) {
        //   return (
        //     <div className="w-full h-48 flex items-center justify-center">
        //       <div
        //         className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 p-4"
        //         role="alert"
        //       >
        //         <p className="font-bold text-base">
        //           Your account is Not activated
        //         </p>
        //         <div className="mt-4">
        //           <button
        //             className="border-2 border-green-600 hover:border-green-700 text-green-600 hover:text-green-700 text-sm font-semibold py-1 px-4 rounded focus:outline-none focus:shadow-outline"
        //             type="button"
        //             disabled={activating}
        //             onClick={activateAcc}
        //           >
        //             {activating ? "Activating" : "Activate"}
        //           </button>
        //         </div>
        //       </div>
        //     </div>
        //   );
        // }

        return (
          <div className="flex justify-center mt-8">
            <form onSubmit={handleSubmit} className="w-full max-w-sm">
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
                  placeholder="tz1a9w1S..."
                  name="to"
                  required
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
                  name="amount"
                  required
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
                  name="fee"
                  required
                />
              </div>
              <div className="flex items-center justify-between mt-8">
                <button
                  className={classNames(
                    "bg-green-500 hover:bg-green-700 text-white text-base font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline",
                    sending && "opacity-50"
                  )}
                  type="submit"
                  disabled={sending}
                >
                  {sending ? "Sending..." : "Send transaction"}
                </button>
              </div>
            </form>
          </div>
        );
      })()}
    </>
  );
};

export default TransferFunds;
