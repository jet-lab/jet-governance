import { useWallet } from "@solana/wallet-adapter-react";
import { useDarkTheme } from "../contexts/darkTheme";
import { useBlockExplorer } from "../contexts/blockExplorer";
import { Button, Select, Switch, Divider } from "antd";
import { ReactComponent as WalletIcon } from "../images/wallet_icon.svg";
import { shortenAddress } from "../utils";
import { useConnectWallet } from "../contexts/connectWallet";

export function Settings(): JSX.Element {
  const { setConnecting } = useConnectWallet();
  const { darkTheme, toggleDarkTheme } = useDarkTheme();
  const { blockExplorers, preferredExplorer, changePreferredExplorer } = useBlockExplorer();
  const { connected, wallet, publicKey, disconnect } = useWallet();
  const { Option } = Select;

  return (
    <div className="view-container flex justify-center column">
      <div className="settings">
        <div className="setting wallet flex align-start justify-center column">
          <span className="setting-title bold-text">WALLET</span>
          {wallet && connected && publicKey ? (
            <div className="flex-centered">
              <img
                width="20px"
                height="auto"
                src={`img/wallets/${wallet.name.replace(" ", "_").toLowerCase()}.png`}
                alt={`${wallet.name} Logo`}
              />
              <span className="wallet-address">{shortenAddress(publicKey.toString(), 4)}</span>
              <Button ghost size="small" onClick={() => disconnect()}>
                DISCONNECT
              </Button>
            </div>
          ) : (
            <div>
              <Button ghost className="flex-centered small-btn" onClick={() => setConnecting(true)}>
                <WalletIcon width="17px" />
                CONNECT
              </Button>
            </div>
          )}
        </div>
        <Divider />
        <div className="setting flex align-start justify-center column">
          <span className="setting-title bold-text">THEME</span>
          <div className="theme-toggle-container flex align-center justify-start">
            <Switch
              onClick={() => toggleDarkTheme()}
              checkedChildren="Dark"
              unCheckedChildren="Light"
              checked={darkTheme}
            />
          </div>
        </div>
        <Divider />
        <div className="setting flex align-start justify-center column">
          <span className="setting-title bold-text">EXPLORER</span>
          <Select
            value={blockExplorers[preferredExplorer].name}
            onChange={value => changePreferredExplorer(value)}
          >
            {Object.keys(blockExplorers).map(explorer => (
              <Option key={explorer} value={explorer}>
                {blockExplorers[explorer].name}
              </Option>
            ))}
          </Select>
        </div>
        <Divider />
        <div className="socials flex align-center justify-start">
          <a href="https://twitter.com/jetprotocol" target="_blank" rel="noopener noreferrer">
            <i className="text-gradient fab fa-twitter"></i>
          </a>
          <a href="https://discord.gg/RW2hsqwfej" target="_blank" rel="noopener noreferrer">
            <i className="text-gradient fab fa-discord"></i>
          </a>
          <a href="https://github.com/jet-lab" target="_blank" rel="noopener noreferrer">
            <i className="text-gradient fab fa-github"></i>
          </a>
        </div>
      </div>
    </div>
  );
}