import { Modal } from "antd";
import React from "react";
import { useConnectWallet } from "../../contexts/connectWallet";
import { useInitModal } from "../../contexts/initModal";

export const InitModal = (props: {
  showModal: boolean;
  cancelInitModal: () => void;
}) => {
  const { showModal, cancelInitModal } = props;
  const { setShowInitModal } = useInitModal();
  const { setConnecting, connecting } = useConnectWallet();

  const connectWallet = () => {
    console.log("connecting", connecting)
    setConnecting(true)
    cancelInitModal()
  }
  
  return (
    <Modal
      title={`Stake your JET to earn rewards and start voting today!`}
      visible={showModal}
      okText="Stake your Jet"
      onOk={connectWallet}
      onCancel={setShowInitModal}
      cancelButtonProps={{ style: { display: "none" } }}
    >
      <p>Welcome to Jet Govern - the governance app for Jet Protocol. Here, you earn rewards and help pilot the direction of Jet Protocol by staking your JET into the app.</p>

      <p>
        To start voting, connect your wallet and deposit some JET today!
      </p>
    </Modal>
  );
};
