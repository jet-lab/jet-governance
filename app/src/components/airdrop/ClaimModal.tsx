import { useState, useEffect } from "react";
import { Modal, Timeline } from "antd";
import React from "react";

export const ClaimModal = (props: {
  showModal: boolean;
  stakeAmount: number | null;
  setShowModal: Function;
}) => {
  const { showModal, stakeAmount, setShowModal } = props;

  const handleOk = () => {
    setShowModal(false);
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  return (
    <Modal
      title="You just received an airdrop!"
      visible={showModal}
      okText="Okay"
      onOk={handleOk}
      onCancel={handleCancel}
      cancelButtonProps={{ style: { display: "none " } }}
    >
      <p>
        You can use your airdrop tokens to vote immediately, but staking rewards
        will only begin to accrue when your airdrop has vested.
      </p>

      <p>
        <Timeline>
          <Timeline.Item>{new Date().toDateString} Claimed</Timeline.Item>
          <Timeline.Item>
            Vesting period begins
          </Timeline.Item>
          <Timeline.Item>Vesting complete</Timeline.Item>
        </Timeline>
      </p>
    </Modal>
  );
};
