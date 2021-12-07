import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { getRemainingTime } from "../../utils/utils";

export const Available = (props: any) => {
  const { name, amount, end, claimed } = props;
  const [currentTime, setCurrentTime] = useState(Date.now());
  const { connected, wallet, publicKey, disconnect } = useWallet();

  // Update current time every second
  useEffect(() => {
    const secondInterval = setInterval(() => {
      setCurrentTime(currentTime + 1000);
    }, 1000);
    return () => clearInterval(secondInterval);
  });

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
      >
        {claimed ? <CheckOutlined /> : "claim"}
      </Button>
    </div>
  );
};
