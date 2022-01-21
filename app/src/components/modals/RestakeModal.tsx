import { useState, useEffect } from "react";
import { Modal, Timeline } from "antd";
import React from "react";

export const RestakeModal = ({ showModal, stakeAmount, onClose }: {
  showModal: boolean;
  stakeAmount: number | null;
  onClose: () => void;
}) => {

  const handleOk = () => {
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      title={`Restake ${stakeAmount} JET?`}
      visible={showModal}
      okText="Okay"
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <p>
        Restaking will cancel your unstake transaction and you will immediately be able to vote and earn rewards. Any votes on active proposals that were rescinded by choosing to unstake must be recast.
      </p>
    </Modal>
  );
};
