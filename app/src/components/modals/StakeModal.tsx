import { useState } from "react";
import { Modal } from "antd";
import React from "react";

export const StakeModal = (props: {
  showModal: boolean;
  stakeAmount: number | null;
  setShowStakeModal: Function;
}) => {
  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);

  const { showModal, stakeAmount, setShowStakeModal } = props;

  // Handlers for staking info modal

  const handleSubmitTx = () => {
    setShowStakeModal(false);
    setShowSuccessfulModal(true);
  };

  const handleCancel = () => {
    setShowStakeModal(false);
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
        closable={true}
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
        closable={true}
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
