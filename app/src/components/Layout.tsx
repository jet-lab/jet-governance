import React from "react";
import "../App.less";
import { Layout } from "antd";
import { ConnectWalletModal } from "./modals/ConnectWalletModal";
import { Nav } from "./Nav";
import { WalletModalProvider } from "../contexts";

const { Content } = Layout;

export const AppLayout = React.memo(({ children }) => {
  return (
    <WalletModalProvider>
      <div className="App">
        <Layout>
          <Nav />
          <ConnectWalletModal />
          <Content>{children}</Content>
        </Layout>
      </div>
    </WalletModalProvider>
  );
});