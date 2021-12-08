import { useState, useEffect } from "react";
import { Button, Input, Modal } from "antd";

export const StakeModal = (props: {
  showModal: boolean,
  stakeAmount: number | null,
  setShowStakeModal: Function
}) => {
  const [isStakeRedirectVisible, setIsStakeRedirectModalVisible] = useState(false);
  const [collateral, setCollateral] = useState("500");

  const { showModal, stakeAmount, setShowStakeModal } = props;

  const handleOk = () => {
    setShowStakeModal(false);
  };

  const handleCancel = () => {
    setShowStakeModal(false);
  };

  return (
    <>
      <Modal
        title={`You are staking ${stakeAmount} JET into the platform.`}
        visible={showModal}
        okText="I understand."
        onOk={handleOk}
        onCancel={handleCancel}
        closable={false}
      >
        <p>Staking tokens yields X% APR.</p>

        <p>Please note: All staked tokens require a 30-day unbonding period, which begins when you unstake your tokens.</p>
      </Modal>
    </>
  );
};
