import * as React from "react";
import classNames from "clsx";
import { useForm } from "react-hook-form";
import { useThanosFrontContext } from "lib/thanos/front";
import PageLayout from "app/layout/PageLayout";

type FormData = {
  passphrase: string;
};

const SUBMIT_ERROR_TYPE = "submit-error";

const Unlock: React.FC = () => {
  const { unlock } = useThanosFrontContext();

  const { register, handleSubmit, errors, setError, clearError } = useForm<
    FormData
  >();

  const submittingRef = React.useRef(false);
  const onSubmit = React.useCallback(
    async ({ passphrase }) => {
      if (submittingRef.current) return;
      submittingRef.current = true;

      clearError("passphrase");
      try {
        await unlock(passphrase);
      } catch (err) {
        if (process.env.NODE_ENV === "development") {
          console.error(err);
        }

        // Human delay.
        await new Promise(res => setTimeout(res, 300));
        setError("passphrase", SUBMIT_ERROR_TYPE, err.message);
      }

      submittingRef.current = false;
    },
    [clearError, setError, unlock]
  );

  return (
    <PageLayout>
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
              htmlFor="unlock_passphrase_field"
            >
              Passphrase
            </label>
            <input
              ref={register({ required: "Required." })}
              type="password"
              name="passphrase"
              id="unlock_passphrase_field"
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

            {errors.passphrase && (
              <p className="text-red-500 text-xs italic">
                {errors.passphrase.message}
              </p>
            )}
          </div>
        </form>
      </div>
    </PageLayout>
  );
};

export default Unlock;
