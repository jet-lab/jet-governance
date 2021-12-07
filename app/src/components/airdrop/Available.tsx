import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button, Modal, Timeline } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { getRemainingTime } from "../../utils/utils";

export const Available = (props: any) => {
  const { name, amount, end, claimed, vested } = props;
  const [currentTime, setCurrentTime] = useState(Date.now());
  const { connected, wallet, publicKey, disconnect } = useWallet();

  // Update current time every second
  useEffect(() => {
    const secondInterval = setInterval(() => {
      setCurrentTime(currentTime + 1000);
    }, 1000);
    return () => clearInterval(secondInterval);
  });

  const claimAirdrop = () => {
    Modal.info({
      title: "You just received an airdrop!",
      centered: true,
      content: (
        <div>
          <p>
            You can use your airdrop tokens to vote immediately, but staking
            rewards will only begin to accrue when your airdrop has vested.
          </p>
          <Timeline>
            <Timeline.Item>Claimed</Timeline.Item>
            <Timeline.Item className="incomplete">
              Vesting period begins
            </Timeline.Item>
            <Timeline.Item className="incomplete">Vesting complete</Timeline.Item>
          </Timeline>
        </div>
      ),
      okText: `I understand`,
      onOk() {},
    });
  };

  return (
    <div className="flex justify-between align-center">
      <span className="avail-info">
        <strong>
          {name} | {amount} JET
        </strong>{" "}
        Info about airdrop info, etc. Available for each user.{" "}
        <span className="gray">
          Ends in {getRemainingTime(currentTime, end)}
        </span>
      </span>
      <Button
        type="primary"
        className={`claim-button ${claimed ? "disabled" : ""}`}
        onClick={claimAirdrop}
      >
        {claimed ? <CheckOutlined /> : "claim"}
      </Button>
    </div>
  );
};
