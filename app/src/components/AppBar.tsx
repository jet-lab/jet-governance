import { Button } from "antd";
import { useConnectWallet } from "../contexts/connectWallet";

export const AppBar = (props: { left?: JSX.Element; right?: JSX.Element }) => {
  const { setConnecting } = useConnectWallet();

  const ConnectWalletButton = (
    <div className="nav-bar-right connect-wallet">
      <Button onClick={()=>setConnecting(true)}>Test</Button>
    </div>
  );

  return ConnectWalletButton;
};
