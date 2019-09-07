import * as React from "react";
import useConseilJSContext from "lib/useConseilJSContext";
import useAccountContext from "lib/useAccountContext";
import useThanosContext from "lib/useThanosContext";

const App: React.FC = () => {
  return (
    <useConseilJSContext.Provider>
      <useAccountContext.Provider>
        <useThanosContext.Provider>KEK</useThanosContext.Provider>
      </useAccountContext.Provider>
    </useConseilJSContext.Provider>
  );
};

export default App;

// const ThanosCheck: React.FC = () => {
//   const { initialized, setup } = useAccountContext();
//   React.useEffect(() => {
//     if (initialized) {
//       setup({
//         mnemonic: [
//           "garbage",
//           "utility",
//           "estate",
//           "lounge",
//           "lava",
//           "fantasy",
//           "wish",
//           "old",
//           "alter",
//           "clinic",
//           "because",
//           "vintage",
//           "donate",
//           "trumpet",
//           "lemon"
//         ],
//         secret: "129f0ea640d93dfbe8c25e640f521441f6f848f1",
//         amount: "43888838596",
//         pkh: "tz1abiiJXDW9hdCAbpF79xM5EVK1diAgnXeH",
//         password: "F7MTvJTNFW",
//         email: "htrtjpnq.jgczvxww@tezos.example.org"
//       });
//     }
//   }, [initialized, setup]);

//   return null;
// };
