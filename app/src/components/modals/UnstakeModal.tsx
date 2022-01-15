import { useState } from "react";
import { Modal } from "antd";
import React from "react";

export const UnstakeModal = (props: {
  showModal: boolean;
  onClose: () => void;
  setInputAmount: Function,
  amount: number | null;
}) => {
  const [current, setCurrent] = useState(0);
  const { showModal, onClose, setInputAmount, amount } = props;

  const handleSubmitUnstake = () => {
    setCurrent(1);
  };

  const handleCancel = () => {
    onClose();
    setInputAmount(null)
  };

  const steps = [
    {
      title: `You're unstaking ${
        amount && Intl.NumberFormat("us-US").format(amount)
      } JET from the platform.`,
      okText: "Confirm unstake",
      onOk: () => setCurrent(1),
      onCancel: () => onClose(),
      content: [
        <>
          <p>
            You currently have votes cast on active proposals, which will be rescinded upon unbonding. If you wish to keep your votes, wait until the voting period has ended before unstaking.
          </p>
          <p>
            Unstaked tokens have a 29.5-day unbonding period. During this period, you will not earn any rewards.
          </p>
          <p>
            Your flight log will reflect a status of unbonding until this period has completed.
          </p>
        </>
      ],
      closable: true,
      cancelButtonProps: undefined,
    },
    {
      title: `All set!`,
      okText: "Okay",
      onOk: () => onClose(),
      onCancel: () => onClose(),
      content: [
        <>
          <p>
            You've unstaked {
        amount && Intl.NumberFormat("us-US").format(amount)
      } JET from JetGovern.
          </p>
          <p>
            Your 29.5-day unbonding period will complete on {new Date().toString()}.
          </p>
        </>
      ],
      closable: true,
      cancelButtonProps: { display: "none " },
    }
  ];

  return (
    <Modal
      title={steps[current].title}
      visible={showModal}
      okText={steps[current].okText}
      onOk={steps[current].onOk}
      onCancel={steps[current].onCancel}
      cancelButtonProps={{ style: steps[current].cancelButtonProps }}
    >
      {steps[current].content}
    </Modal>
  );
};
