import { Modal } from "antd";
import React from "react";
import { useInitModal } from "../../contexts/initModal";

export const InitModal = (props: {
  showModal: boolean;
}) => {
  const { showModal } = props;
  const { setShowInitModal } = useInitModal();

  return (
    <Modal
      title={`Stake your JET to earn rewards and start voting today!`}
      visible={showModal}
      okText="Stake your Jet"
      onOk={setShowInitModal}
      onCancel={setShowInitModal}
      cancelButtonProps={{ style: { display: "none " } }}
    >
      <p>Welcome to Jet Govern - the governance app for Jet Protocol. Here, you earn rewards and help pilot the direction of Jet Protocol by staking your JET into the app.</p>

      <p>
        To start voting, connect your wallet and deposit some JET today!
      </p>
    </Modal>
  );
};
