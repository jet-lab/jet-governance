import { Button, Input, Modal } from "antd";

export const VotingBalanceModal = (props: {
  showModal: boolean;
  setShowModal: Function;
}) => {
  const { showModal, setShowModal } = props;

  // Handlers for Tx successful modal
  const handleOk = () => {
    setShowModal(false);
  };

  return (
    <>
      <Modal
        title={`What is a voting balance?`}
        visible={showModal}
        okText="Okay"
        onOk={handleOk}
        closable={true}
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
