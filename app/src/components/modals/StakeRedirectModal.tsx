import { Modal } from "antd";
import React from "react";

export const StakeRedirectModal = (props: {
  visible: boolean;
  onClose: () => void;
}) => {

  const {
    visible,
    onClose,
  } = props;
  
  // Handlers for stake redirect modal
  const handleOk = () => {
    onClose();
  };

  return (
    <Modal
      title="Before you can vote, you have to stake some JET tokens."
      visible={visible}
      okText="I understand"
      onOk={handleOk}
      cancelButtonProps={{ style: { display: "none " } }}
    >
      <p>You gotta stake!</p>
    </Modal>
  )
}