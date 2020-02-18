import * as React from "react";
import classNames from "clsx";
import { useForm } from "react-hook-form";
import { useThanosFront } from "lib/thanos/front";

type FormData = {
  privateKey: string;
};

const SUBMIT_ERROR_TYPE = "submit-error";

const ImportAccount: React.FC = () => {
  const { importAccount } = useThanosFront() as any;

  const { register, handleSubmit, errors, setError, clearError } = useForm<
    FormData
  >();

  const submittingRef = React.useRef(false);
  const onSubmit = React.useCallback(
    async ({ privateKey }) => {
      if (submittingRef.current) return;
      submittingRef.current = true;

      clearError("privateKey");
      try {
        await importAccount(privateKey);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        // Human delay.
        await new Promise(res => setTimeout(res, 300));
        setError("privateKey", SUBMIT_ERROR_TYPE, err.message);
      }

      submittingRef.current = false;
    },
    [clearError, setError, importAccount]
  );

  return (
    <div
      className={classNames(
        "w-full min-h-screen",
        "flex items-center justify-center"
      )}
    >
      <form className="max-w-sm" onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="import_account_privatekey_field"
          >
            Private Key
          </label>
          <input
            ref={register({ required: "Required." })}
            type="password"
            name="privateKey"
            id="import_account_privatekey_field"
            placeholder="********"
            className={classNames(
              "w-full h-20",
              "border-4 border-gray-100 focus:border-gray-200",
              "bg-gray-100 focus:bg-white focus:outline-none",
              "p-2",
              "text-base",
              "rounded overflow-hidden"
            )}
          />

          {errors.privateKey && (
            <p className="text-red-500 text-xs italic">
              {errors.privateKey.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-8">
          <button
            className="border-2 border-green-500 hover:border-green-700 bg-green-500 hover:bg-green-700 text-white text-base font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
            type="submit"
          >
            Submit
          </button>
          <div className="flex-1" />
        </div>
      </form>
    </div>
  );
};

export default ImportAccount;
