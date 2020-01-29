import * as React from "react";
import Header from "./PageLayout/Header";
import Content from "./PageLayout/Content";

interface LayoutProps {
  popup?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ popup, children }) => (
  <>
    <Header popup={popup} />
    <Content popup={popup}>{children}</Content>
  </>
);

export default Layout;
