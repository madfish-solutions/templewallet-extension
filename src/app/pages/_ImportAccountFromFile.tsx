import * as React from "react";
import { Link } from "lib/woozie";
import { useThanosWalletContext } from "lib/thanos-wallet";

const ImportAccountFromFile: React.FC = () => {
  const { importAccount } = useThanosWalletContext();
  const [loading, setLoading] = React.useState(false);

  const handleChange = React.useCallback(
    (evt: any) => {
      if (loading) return;
      setLoading(true);

      const reader = new FileReader();
      reader.onerror = () => {
        alert(`Oops, error with upload Your file`);
        setLoading(false);
      };
      reader.onload = (readEvt: any) => {
        (async () => {
          try {
            const acc = JSON.parse(readEvt.target.result);
            await importAccount(acc);
            setLoading(false);
          } catch (err) {
            alert(
              `Oops, error!\n"${err.message}"\nYour data may be invalid, or smth with us;(`
            );
            setLoading(false);
          }
        })();
      };

      reader.readAsText(evt.target.files[0]);
    },
    [importAccount, setLoading, loading]
  );

  return (
    <>
      <div className="bg-gray-100 px-8 py-4 -mt-8 -mx-8 mb-4 flex items-center">
        <Link to="/import/manual">
          <button
            className="border-2 border-gray-600 hover:border-gray-700 text-gray-600 hover:text-gray-700 text-sm font-semibold py-1 px-4 rounded focus:outline-none focus:shadow-outline"
            type="button"
          >
            Back
          </button>
        </Link>
      </div>

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
              accept=".json,application/json"
              onChange={handleChange}
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
                <title>{"Upload"}</title>
                <path d="M12 4v13M7 8l5-5 5 5M20 21H4" />
              </svg>
              <div className="w-full text-center">
                {loading ? "Uploading..." : "Select file..."}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-8">
            <button
              className="border-2 border-green-500 hover:border-green-700 bg-green-500 hover:bg-green-700 text-white text-base font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
              type="submit"
            >
              Restore
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ImportAccountFromFile;
