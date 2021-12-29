import { useState } from "react";
import { Modal } from "antd";
import React from "react";

export const StakeModal = (props: {
  showModal: boolean;
  stakeAmount: number | null;
  onClose: () => void;
}) => {
  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);

  const { showModal, stakeAmount, onClose } = props;

  // Handlers for staking info modal

  const handleSubmitTx = () => {
    onClose();
    setShowSuccessfulModal(true);
  };

  const handleCancel = () => {
    onClose();
  };

  // Handlers for Tx successful modal
  const handleOk = () => {
    setShowSuccessfulModal(false);
  };

  return (
    <>
      <Modal
        title={`You are staking ${stakeAmount} JET into the platform.`}
        visible={showModal}
        okText="I understand."
        onOk={handleSubmitTx}
        onCancel={handleCancel}
        cancelButtonProps={{ style: { display: "none " } }}
      >
        <p>Staking tokens yields X% APR.</p>

        <p>APR = 365 *  (total_daily_reward / total stake)</p>

        <p>
          Please note: All staked tokens require a 30-day unbonding period,
          which begins when you unstake your tokens.
        </p>

        <p>
          Staked tokens will continue to earn staking rewards during the unbonding period.
        </p>
      </Modal>

      <Modal
        title={`Transaction successful`}
        visible={showSuccessfulModal}
        okText="Okay"
        onOk={handleOk}
        onCancel={handleCancel}
        cancelButtonProps={{ style: { display: "none " } }}
      >
        <p>
          You've staked {stakeAmount} JET into JetGovernance and can begin
          voting with it immediately.
        </p>

        <p>View your transaction on the blockchain here.</p>
      </Modal>
    </>
  );
};
