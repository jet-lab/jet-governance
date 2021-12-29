import { Button, Input, Modal } from "antd";
import React from "react";

export const VotingBalanceModal = (props: {
  showModal: boolean;
  onClose: () => void;
}) => {
  const { showModal, onClose } = props;

  // Handlers for Tx successful modal
  return (
    <>
      <Modal
        title={`What is a voting balance?`}
        visible={showModal}
        okText="Okay"
        onOk={onClose}
        onCancel={onClose}
        cancelButtonProps={{ style: { display: "none " } }}
      >
        <p>
          Your voting balance is made up of your staked tokens plus any
          currently vesting airdrops.
        </p>

        <p>
          You may vote with all of these tokens, but you can only accrue rewards
          and unstake tokens that are fully vested.
        </p>
      </Modal>
    </>
  );
};
