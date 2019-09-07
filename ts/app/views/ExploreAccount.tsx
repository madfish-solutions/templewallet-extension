import * as React from "react";
import jdenticon from "jdenticon";

const ExploreAccount: React.FC = () => (
  <>
    <div className="flex flex-col items-center text-center">
      <h1 className="text-3xl mb-4 text-gray-800">Explore Account</h1>
      <img
        src="../misc/tezoslogo.png"
        width="80px"
        height="80px"
        className="mb-4"
      />
      <h3 className="text-3xl font-thin text-gray-800">
        Balance: <b>100.04</b> ꜩ
      </h3>
      <h4 className="text-xl mb-4 font-light text-gray-500">$200.34</h4>
    </div>

    <div className="flex justify-center max-w-sm mx-auto">
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white text-base font-bold mr-2 py-2 px-6 rounded focus:outline-none focus:shadow-outline w-full"
        type="button"
      >
        Send
      </button>
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white text-base font-bold ml-2 py-2 px-6 rounded focus:outline-none focus:shadow-outline w-full"
        type="button"
      >
        Receive
      </button>
    </div>

    <div className="flex justify-center mt-8">
      <form className="w-full max-w-sm">
        <h3 className="text-lg text-gray-500 mb-4">Transaction History</h3>
        <div className="flex flex-col">
          <div
            className="flex justify-between content-center mb-2"
            style={{ height: "36px" }}
          >
            <img
              src={URL.createObjectURL(
                new Blob(
                  [jdenticon.toSvg("tz1a9w1SBZzxB3Uc5SkrHxLLSbAcJovKRVjp", 36)],
                  { type: "image/svg+xml" }
                )
              )}
              width="36px"
              height="36px"
            />
            <div
              style={{ lineHeight: "36px" }}
              className="text-gray-400 text-base truncate px-2"
            >
              From: tz1a9w1SBZzxB3Uc5SkrHxLLSbAcJovKRVjp
            </div>
            <div
              style={{ lineHeight: "36px" }}
              className="flex-shrink-0 text-green-500 text-lg"
            >
              + 10 ꜩ
            </div>
          </div>
          <div
            className="flex justify-between content-center mb-2"
            style={{ height: "36px" }}
          >
            <img
              src={URL.createObjectURL(
                new Blob(
                  [jdenticon.toSvg("tz1a9w1SBZzxB3Uc5SkrHxLLSbAcJovKRVjx", 36)],
                  { type: "image/svg+xml" }
                )
              )}
              width="36px"
              height="36px"
            />
            <div
              style={{ lineHeight: "36px" }}
              className="text-gray-400 text-base truncate px-2"
            >
              To: tz1a9w1SBZzxB3Uc5SkrHxLLSbAcJovKRVjx
            </div>
            <div
              style={{ lineHeight: "36px" }}
              className="flex-shrink-0 text-red-700 text-lg"
            >
              - 5 ꜩ
            </div>
          </div>
        </div>
      </form>
    </div>
  </>
);

export default ExploreAccount;
