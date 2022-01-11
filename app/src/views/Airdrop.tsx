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
          Available claims for the connected wallet are listed below. All claims must be claimed by the receiver within 90 days. After 90 days, any unclaimed claims will be redirected to the Jet DAO treasury for future allocation.
        </p>
        
        <p>
        Airdrop claims deposit a fixed amount of Jet tokens into your governance account. These tokens are staked to JetGovern and will begin accruing rewards immediately. 
        </p>

        <Divider />

        <h1>Available</h1>
        {connected &&
          airdrops?.map((airdrop) => (
            <Available
              name={airdrop.name}
              amount={airdrop.amount}
              description={airdrop.description}
              end={airdrop.end}
              claimed={airdrop.claimed}
              announced={airdrop.announced}
            />
          ))}
      </div>
    </div>
  );
};
