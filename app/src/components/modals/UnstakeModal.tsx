import { useState } from "react";
import { Modal } from "antd";

export const UnstakeModal = (props: {
  showModal: boolean;
  setShowStakeModal: Function;
  unstakedAmount: number | null;
}) => {
  const [unstakeSuccess, setUnstakeSuccess] = useState(false);
  const { showModal, unstakedAmount, setShowStakeModal } = props;

  const handleOk = () => {
    setShowStakeModal(false);
    setUnstakeSuccess(true);
  };

  const handleCancel = () => {
    setShowStakeModal(false);
    setUnstakeSuccess(false);
  };

  return (
    <>
      <Modal
        title={`You are unstaking ${unstakedAmount} JET from the platform.`}
        visible={showModal}
        okText="Confirm"
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <p>
          You have two active votes that will be rescinded upon confirmation of
          unstaking. If you would like to keep your votes, wait until the voting
          period has ended to unstake.
        </p>

        <p>
          Unstaked tokens have a 30-day bonding period. Your transaction will
          show up as pending in your flight log until the bonding period has
          completed.
        </p>
      </Modal>

      <Modal
        title={`You have successfully unstaked ${unstakedAmount} JET.`}
        visible={unstakeSuccess}
        okText="Confirm"
        onOk={handleOk}
        onCancel={handleCancel}
        cancelButtonProps={{ style: { display: "none " } }}
      >
      </Modal>
    </>
  );
};
