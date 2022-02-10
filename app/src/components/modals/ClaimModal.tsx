import { Modal, ModalProps, Timeline } from "antd";
import { ReactNode, useState } from "react";

enum Steps {
  AirdropReceived = 0,
  Error = 1
}

export const ClaimModal = ({ visible, stakeAmount, setShowModal }: {
  visible: boolean;
  stakeAmount: number | null;
  setShowModal: Function;
}) => {
  const [current, setCurrent] = useState<Steps>(Steps.AirdropReceived);

  const handleOk = () => {
    setShowModal(false);
  };

  const handleCancel = () => {
    setShowModal(false);
  };

  const steps: (ModalProps & { content: ReactNode })[] = []
  steps[Steps.AirdropReceived] = {
    title: "You just received an airdrop!",
    okText: "Okay",
    onOk: () => handleOk(),
    onCancel: () => handleCancel(),
    content: (
      <>
        <p>
          You can use your airdrop tokens to vote immediately, but staking
          rewards will only begin to accrue when your airdrop has vested.
        </p>

        <p>
          <Timeline>
            <Timeline.Item>{new Date().toDateString} Claimed</Timeline.Item>
            <Timeline.Item>Vesting period begins</Timeline.Item>
            <Timeline.Item>Vesting complete</Timeline.Item>
          </Timeline>
        </p>
      </>
    ),
    closable: false,
  }
  steps[Steps.Error] = {
    title: "Error ",
    okText: "Okay",
    onOk: () => handleCancel(),
    onCancel: () => handleCancel(),
    content: (
      <>
        <p>
          We have encountered an unknown error
        </p>
      </>
    ),
    closable: false,
  };

  return (
      <Modal
      title={steps[current].title}
      visible={visible}
      okText={steps[current].okText}
      onOk={steps[current].onOk}
      okButtonProps={steps[current].okButtonProps}
      onCancel={steps[current].onCancel}
      closable={steps[current].closable}
      cancelButtonProps={{ style: { display: "none " } }}
    >
      {steps[current].content}
    </Modal>
  );
};
