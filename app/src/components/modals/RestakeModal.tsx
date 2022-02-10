import { PropsWithChildren, ReactNode, useState } from "react";
import { Modal, ModalProps } from "antd";

enum Steps {
  RestakeConfirm = 0,
  RestakeSuccess = 1,
  Error = 2,
}

export const RestakeModal = ({ visible, stakeAmount, onClose }: {
  visible: boolean;
  stakeAmount: number;
  onClose: () => void;
}) => {
  const [current, setCurrent] = useState<Steps>(Steps.RestakeConfirm)

  const handleOk = () => {
    setCurrent(Steps.RestakeSuccess)
  };

  const handleCancel = () => {
    onClose();
  };

  const steps: (ModalProps & { content: ReactNode })[] = []

  steps[Steps.RestakeConfirm] = {
    title: `Confirm you'd like to restake?`,
    okText: "I understand.",
    onOk: () => handleOk(),
    onCancel: () => handleCancel(),
    content: 
      <>
        <p>
          Choosing to restake will cancel your unstake transaction and you will immediately be able to vote and earn rewards with this amount.
        </p>
        
        <p>
          Votes that were rescinded when unstaking will not reactivate, and must be recast. 
        </p>
      </>
    ,
    closable: true,
    cancelButtonProps: undefined,
  }
  steps[Steps.RestakeSuccess] = {
    title: `All set!`,
    okText: "I understand.",
    onOk: () => onClose(),
    onCancel: () => onClose(),
    content: (
      <>
        <p>
        You've restaked {Intl.NumberFormat("us-US").format(stakeAmount)} JET into JetGovern and can begin voting on active proposals immediately. 
        </p>
        <p>Please refresh your page to see your update balance.</p>
      </>
    ),
    closable: true,
    cancelButtonProps: { style: { display: "none " } },
  }
  steps[Steps.Error] = {
    title: "Error",
    okText: "I understand.",
    onOk: () => setCurrent(Steps.RestakeConfirm),
    onCancel: () => onClose(),
    content: 
        <p>
          We have encountered an unknown error, please try again.
        </p>
    ,
    closable: true,
    cancelButtonProps: { style: { display: "none " } },
  }

  return (
    <Modal
      title={steps[current].title}
      visible={visible}
      okText={steps[current].okText}
      onOk={steps[current].onOk}
      onCancel={steps[current].onCancel}
      cancelButtonProps={steps[current].cancelButtonProps}
    >
      {steps[current].content}
    </Modal>
  );
};
