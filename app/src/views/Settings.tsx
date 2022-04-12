import { useWallet } from "@solana/wallet-adapter-react";
import { Button, Select, Switch, Divider } from "antd";
import { useState } from "react";
import { JetInput } from "../components/JetInput";
import { useBlockExplorer, useConnectWallet, useDarkTheme } from "../contexts";
import { useRpcNode } from "../contexts/rpcNode";
import { ReactComponent as WalletIcon } from "../images/wallet_icon.svg";
import { isValidHttpUrl, shortenAddress } from "../utils";

export function SettingsView(): JSX.Element {
  const { setConnecting } = useConnectWallet();
  const { darkTheme, toggleDarkTheme } = useDarkTheme();
  const { blockExplorers, preferredExplorer, changePreferredExplorer } = useBlockExplorer();
  const { preferredNode, ping, updateRpcNode } = useRpcNode();
  const { connected, wallet, publicKey, disconnect } = useWallet();
  const { Option } = Select;

  // RPC node input checking
  const [rpcNodeInput, setRpcNodeInput] = useState<string>("");
  const [rpcInputError, setRpcInputError] = useState<string>("");
  function checkRPC() {
    if (!rpcNodeInput || !isValidHttpUrl(rpcNodeInput)) {
      setRpcNodeInput("");
      setRpcInputError("No URL");
      return;
    }

    setRpcInputError("");
    setRpcNodeInput("");
    updateRpcNode(rpcNodeInput);
  }

  return (
    <div className="view flex justify-center column">
      <div className="settings">
        <div className="flex align-start justify-center column setting">
          <span className="setting-title bold-text">RPC NODE</span>
          <div
            className="rpc-info flex align-center justify-start"
            style={{ padding: "var(--spacing-xs) 0" }}
          >
            <span>{preferredNode ?? "Jet Default"}</span>
            {ping > 0 && (
              <>
                <div
                  className="ping-indicator"
                  style={{
                    background: ping < 1000 ? "var(--success)" : "var(--failure)"
                  }}
                ></div>
                <span className={ping < 1000 ? "success-text" : "danger-text"}>({ping}ms)</span>
              </>
            )}
            {preferredNode && (
              <span
                className="reset-rpc gradient-text semi-bold-text"
                onClick={() => updateRpcNode()}
              >
                RESET
              </span>
            )}
          </div>
          <JetInput
            type="text"
            value={rpcNodeInput || ""}
            error={rpcInputError}
            placeholder="ex: https://api.devnet.solana.com/"
            onClick={() => setRpcInputError("")}
            onChange={(value: string) => setRpcNodeInput(value.toString())}
            submit={checkRPC}
          />
          <Divider />
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
            <i className="gradient-text fab fa-twitter"></i>
          </a>
          <a href="https://discord.gg/RW2hsqwfej" target="_blank" rel="noopener noreferrer">
            <i className="gradient-text fab fa-discord"></i>
          </a>
          <a href="https://github.com/jet-lab" target="_blank" rel="noopener noreferrer">
            <i className="gradient-text fab fa-github"></i>
          </a>
        </div>
      </div>
    </div>
  );
}
