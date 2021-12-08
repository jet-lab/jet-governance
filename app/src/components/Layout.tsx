import React from "react";
import "../App.less";
import { Layout, Switch, Menu } from "antd";
import Logo from "../images/jetgovern_white.png";
import { WalletModalProvider } from "@solana/wallet-adapter-ant-design";
import { ConnectWalletModal } from "./ConnectWalletModal";
import { Nav } from "./Nav";

const { Header, Content } = Layout;

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
