import { Divider } from "antd";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAirdrop } from "../contexts/airdrop";
import { Available } from "../components/airdrop/Available";

export const AirdropView = () => {
  const { connected } = useWallet();
  const { airdrops } =
    useAirdrop();

  return (
    <div className="view-container" id="airdrop">
      <div>
        <h2>Airdrop</h2>
        <div className="neu-container">
          <h1>Here's how your airdrop works.</h1>
          <p>
            Airdrop claims deposit a fixed amount of Jet tokens into your
            governance account. These tokens are locked for a 30-day vesting
            period, during which time you may vote with your tokens. As tokens
            are vested, they can remain staked to accrue rewards or you can
            choose to unstake them.
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
    </div>
  );
};
