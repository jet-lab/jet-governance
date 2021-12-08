import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button, Modal, Timeline } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { getRemainingTime } from "../../utils/utils";
import { ClaimModal } from "./ClaimModal";

export const Available = (props: any) => {
  const [showModal, setShowModal] = useState(false);
  const { connected, wallet, publicKey, disconnect } = useWallet();
  const { name, amount, end, claimed, vested } = props;
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second
  useEffect(() => {
    const secondInterval = setInterval(() => {
      setCurrentTime(currentTime + 1000);
    }, 1000);
    return () => clearInterval(secondInterval);
  });

  const claimAirdrop = () => {
    setShowModal(true);
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
        className="claim-button"
        onClick={claimAirdrop}
        disabled={claimed ? true : false}
      >
        {claimed ? <CheckOutlined /> : "claim"}
      </Button>

      <ClaimModal
        showModal={showModal}
        stakeAmount={1000}
        setShowModal={setShowModal}
      />
    </div>
  );
};
