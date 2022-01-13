import { useState } from "react";
import { Modal } from "antd";
import React from "react";

export const UnstakeModal = (props: {
  showModal: boolean;
  setShowUnstakeModal: Function;
  setInputAmount: Function,
  unstakedAmount: number | null;
}) => {
  const [unstakeSuccess, setUnstakeSuccess] = useState(false);
  const { showModal, setShowUnstakeModal, setInputAmount, unstakedAmount } = props;

  const handleOk = () => {
    setShowUnstakeModal(false);
    setUnstakeSuccess(true);
  };

  const handleCancel = () => {
    setShowUnstakeModal(false);
    setUnstakeSuccess(false);
    setInputAmount(null)
  };

  return (
    <>
      <Modal
        title={`You are unstaking ${unstakedAmount} JET from the platform.`}
        visible={showModal}
        okText="Confirm"
        onOk={handleOk}
        onCancel={() => setShowUnstakeModal(false)}
      >
        <p>
          You have two active votes that will be rescinded upon confirmation of
          unstaking. If you would like to keep your votes, wait until the voting
          period has ended to unstake.
        </p>

        <p>
          Unstaked tokens have a 29.5-day bonding period. Your transaction will
          show up as pending in your flight log until the bonding period has
          completed.
        </p>
      </Modal>

      <Modal
        title={`You have successfully unstaked ${unstakedAmount} JET.`}
        visible={unstakeSuccess}
        okText="Confirm"
        onOk={handleCancel}
        cancelButtonProps={{ style: { display: "none " } }}
      >
      </Modal>
    </>
  );
};
