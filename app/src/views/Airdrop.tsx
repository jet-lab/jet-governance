import { Divider, Progress, Collapse, Timeline } from "antd";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAirdrop } from "../contexts/airdrop";
import { Available } from "../components/airdrop/Available";

export const AirdropView = () => {
  const { connected } = useWallet();
  const { airdrops } = useAirdrop();

  const { Panel } = Collapse;

  return (
    <div className="view-container content-body" id="airdrop">
      <div className="panel">
        <h3>Airdrop</h3>
        <div className="neu-container" style={{ maxWidth: "750px"}}>
          <h2>Here's how your airdrop works.</h2>
          <p>
            Airdrop claims deposit a fixed amount of Jet tokens into your
            governance account. These tokens are locked for a 30-day vesting
            period, during which time you may vote with your tokens. As tokens
            are vested, they can remain staked to accrue rewards or you can
            choose to unstake them.
          </p>

          <Divider />

          <h2>Available</h2>
          {connected && airdrops?.map((airdrop) => (
            <Available
              name={airdrop.name}
              amount={airdrop.amount}
              end={airdrop.end}
              claimed={airdrop.claimed}
              vested={airdrop.vested}
            />
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>Your info</h3>
        <div className="header">
          <div className="neu-container">
            <h2>Vesting progress</h2>
            <Progress percent={40} showInfo={false} />
            <Divider />
            <Collapse accordion>
              <Panel header="This is panel header 1" key="1">
                <p>Airdrop Name</p>
                <Timeline>
                  <Timeline.Item>
                    Create a services site 2015-09-01
                  </Timeline.Item>
                  <Timeline.Item>
                    Solve initial network problems 2015-09-01
                  </Timeline.Item>
                  <Timeline.Item>Technical testing 2015-09-01</Timeline.Item>
                  <Timeline.Item>
                    Network problems being solved 2015-09-01
                  </Timeline.Item>
                </Timeline>
              </Panel>
              <Panel header="This is panel header 2" key="2">
                <p>Airdrop Name</p>
              </Panel>
              <Panel header="This is panel header 3" key="3">
                <p>Airdrop Name</p>
              </Panel>
            </Collapse>
          </div>
        </div>
      </div>
    </div>
  );
};
