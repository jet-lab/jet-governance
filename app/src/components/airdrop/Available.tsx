import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button, Modal, Timeline } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { getRemainingTime } from "../../utils/utils";
import { ClaimModal } from "./ClaimModal";

export const Available = (props: {
  name: string,
  amount: number,
  end: any,
  claimed: boolean,
  announced: boolean
}) => {
  const [showModal, setShowModal] = useState(false);
  const { wallet, publicKey } = useWallet();
  const { name, amount, end, claimed, announced } = props;
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
    <div className="flex justify-between align-center avail-list">
      <span className={`avail-info ${announced ? "" : "announced"}`}>
        <strong>
          {announced ? `${name} | ${amount} JET` : "Upcoming airdrop  | ? JET"}
        </strong>{" "}
        Info about airdrop info, etc. Available for each user.{" "}
        <span className="gray">
          Ends in {getRemainingTime(currentTime, end)}
        </span>
      </span>
      <Button
        type="primary"
        className={`claim-button ${announced ? "" : "inactive"}`}
        onClick={claimAirdrop}
        disabled={(claimed || !announced) ? true : false}
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
