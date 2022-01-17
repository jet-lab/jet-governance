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
  
  const handleOk = () => {
    // Redirect to front page
    onClose();
  };

  return (
    <Modal
      title="Before you can vote, you have to stake some JET tokens."
      visible={visible}
      okText="I understand"
      onOk={handleOk}
      onCancel={onClose}
      cancelButtonProps={{ style: { display: "none " } }}
    >
      <p>You gotta stake!</p>
    </Modal>
  )
}