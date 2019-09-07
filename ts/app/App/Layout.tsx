import * as React from "react";
import Header from "./Layout/Header";
import Content from "./Layout/Content";

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
