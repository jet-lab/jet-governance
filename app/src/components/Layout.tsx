import "../App.less";
import { Layout } from "antd";
import React, { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { TermsPrivacy } from "./TermsPrivacy";

const { Content } = Layout;

export const AppLayout = React.memo(({ children }: { children: ReactNode }) => {
  return (
    <div className="App">
      <Layout>
        <Navbar />
        <Content>{children}</Content>
        <TermsPrivacy />
      </Layout>
    </div>
  );
});
