import { Divider } from "antd";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAirdrop } from "../contexts/airdrop";
import { Available } from "../components/airdrop/Available";
import React from "react";

export const AirdropView = () => {
  const { connected } = useWallet();
  const { airdrops } =
    useAirdrop();

  return (
    <div className="view-container column-grid">
      <div className="neu-container centered" id="airdrop">
        <h1>Claim your airdrop!</h1>
        <p>
        Available airdrops are listed below, and can be claimed within 90 days of release. Airdrop claims deposit a fixed amount of Jet tokens into your governance account. These tokens are staked to JetGovern and will begin accruing rewards immediately. 
        </p>

        <Divider />

        <h1>Available</h1>
        {connected &&
          airdrops?.map((airdrop) => (
            <Available
              name={airdrop.name}
              amount={airdrop.amount}
              end={airdrop.end}
              claimed={airdrop.claimed}
              announced={airdrop.announced}
            />
          ))}
      </div>
    </div>
  );
};
