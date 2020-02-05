import * as React from "react";
import Header from "./PageLayout/Header";
import Content from "./PageLayout/Content";

const PageLayout: React.FC = ({ children }) => (
  <>
    <Header />
    <Content>{children}</Content>
  </>
);

export default PageLayout;
