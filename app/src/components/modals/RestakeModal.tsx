import { useState } from "react";
import { Modal } from "antd";

export const RestakeModal = ({ showModal, stakeAmount, onClose }: {
  showModal: boolean;
  stakeAmount: number;
  onClose: () => void;
}) => {
  const [current, setCurrent] = useState(0)

  const handleOk = () => {
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  const steps = [{
    title: `Confirm you'd like to restake?`,
    okText: "I understand.",
    onOk: () => setCurrent(1),
    onCancel: () => onClose(),
    content: [
      <>
        <p>
          Choosing to restake will cancel your unstake transaction and you will immediately be able to vote and earn rewards with this amount.
        </p>
        
        <p>
          Votes that were rescinded when unstaking will not reactivate, and must be recast. 
        </p>
      </>
    ],
    closable: true,
    cancelButtonProps: undefined,
  },{
    title: `All set!`,
    okText: "I understand.",
    onOk: () => onClose(),
    onCancel: () => onClose(),
    content: [
      <>
        <p>
        You've restaked {Intl.NumberFormat("us-US").format(stakeAmount)} JET into JetGovern and can begin voting on active proposals immediately. 
        </p>
      </>
    ],
    closable: true,
    cancelButtonProps: { style: { display: "none " } },
  },]

  return (
    <Modal
      title={steps[current].title}
      visible={showModal}
      okText={steps[current].okText}
      onOk={steps[current].onOk}
      onCancel={steps[current].onCancel}
      cancelButtonProps={steps[current].cancelButtonProps}
    >
      {steps[current].content}
    </Modal>
  );
};
