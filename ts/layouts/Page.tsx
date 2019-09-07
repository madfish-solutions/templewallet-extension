import * as React from "react";
import Header from "./Page/Header";
import Main from "./Page/Main";

const PageLayout: React.FC = ({ children }) => (
  <>
    <Header />
    <Main>{children}</Main>
  </>
);

export default PageLayout;
