import React, { useState } from "react";
import { useProposal } from "../contexts/proposal";
import { Button, Divider, Progress, Collapse, Timeline } from "antd";
import { useWallet } from "@solana/wallet-adapter-react";
import { shortenAddress, formatTokenAmount } from "../utils/utils";
import { useUser } from "../hooks/useClient";
// import { user, proposals } from "../hooks/jet-client/useClient";

export const FlightLogView = () => {
  const { connected, publicKey } = useWallet();

  const { Panel } = Collapse;

  const inputCheck = (value: number) => {
    if (value && value < 0) {
      value = 0;
    }
  };

  return (
    <div className="content-body" id="claim">
      <div className="panel">
        <h3>Airdrop</h3>
        <div className="neu-container">
          <h2>Here’s how your airdrop works.</h2>
          <p>
            Airdrop claims deposit a fixed amount of Jet tokens into your
            governance account. These tokens are locked for a 30-day vesting
            period, during which your tokens incrementally unlock on a rolling
            basis. You may vote with your tokens during this period. As tokens
            are vested, you can unstake them.
          </p>

          <Divider />

          <h2>Available</h2>
          <Collapse accordion>
            <Panel header="This is panel header 1" key="1">
              <p>Airdrop Name</p>
              <Timeline>
                <Timeline.Item>Create a services site 2015-09-01</Timeline.Item>
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

      <div className="panel">
        <h3>Your info</h3>
        <div className="flex justify-between header">
          <div className="neu-container">
            <h2>Vesting progress</h2>
            <Progress percent={40} showInfo={false} />
            <Button type="primary" disabled={!connected}>
              Unlock
            </Button>
            <Divider />
          </div>
        </div>
      </div>
    </div>
  );
};
