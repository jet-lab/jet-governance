import { useState } from "react";
import { Modal } from "antd";
import React from "react";

export const UnstakeModal = ({ visible, onClose, resetInput, amount }: {
  visible: boolean;
  onClose: () => void;
  resetInput: () => void,
  amount: number | null;
}) => {
  const [current, setCurrent] = useState(0);

  const handleSubmitUnstake = () => {
    setCurrent(1);
  };

  const handleCancel = () => {
    onClose();
    resetInput()
  };

  const steps = [
    {
      title: `You're unstaking ${
        amount && Intl.NumberFormat("us-US").format(amount)
      } JET from the platform.`,
      okText: "Confirm unstake",
      onOk: () => handleSubmitUnstake(),
      onCancel: () => onClose(),
      content: [
        <>
          <p>
            You currently have votes cast on active proposals, which will be rescinded upon unbonding. If you wish to keep your votes, wait until the voting period has ended before unstaking.
          </p>
          <p>
            Unstaked tokens have a 29.5-day unbonding period. During this period, you will not earn any rewards.
          </p>
          <p className="text-gradient">
            To continue voting and earning rewards with these tokens, you may restake on the Flight Logs page at any point during the unbonding period.
          </p>
          <p>
            Your flight log will reflect a status of unbonding until this period has completed. You can view detailed information about your token availability by visiting the Flight Logs page.
          </p>
        </>
      ],
      closable: true,
      cancelButtonProps: undefined,
    },
    {
      title: `All set!`,
      okText: "Okay",
      onOk: () => handleCancel(),
      onCancel: () => handleCancel(),
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
      visible={visible}
      okText={steps[current].okText}
      onOk={steps[current].onOk}
      onCancel={steps[current].onCancel}
      cancelButtonProps={{ style: steps[current].cancelButtonProps }}
    >
      {steps[current].content}
    </Modal>
  );
};
