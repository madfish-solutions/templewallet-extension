import * as React from "react";
import WidthContainer from "main/layouts/WidthContainer";
import useConseilJSContext from "lib/useConseilJSContext";

const App: React.FC = () => {
  return (
    <useConseilJSContext.Provider>
      <WidthContainer>
        <div>KEK LAL plS</div>
        <ConseilJSCheck />
      </WidthContainer>
    </useConseilJSContext.Provider>
  );
};

export default App;

const ConseilJSCheck: React.FC = () => {
  const conseiljs = useConseilJSContext();
  console.info(conseiljs);

  return null;
};
