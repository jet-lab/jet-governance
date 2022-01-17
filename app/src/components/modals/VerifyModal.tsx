import { Modal, Input } from "antd";
import { access } from "fs";
import React, { useEffect, useState } from "react";

export const VerifyModal = (props: {
  visible: boolean;
  onClose: () => void;
  verified: boolean;
  authenticated: boolean;
}) => {
  const { visible, onClose, verified, authenticated } = props;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (authenticated && !verified) {
      return setCurrent(2)
    } else if (authenticated && verified) {
      return setCurrent(3)
    }
  }, [verified, authenticated])

  const handlePhoneVerify = () => {
    setCurrent(1)
  }

  const handleConfirmCode = () => {
    // if (Math.floor(Math.random() * 4) === 0) {
    if (authenticated && !verified) {
      return setCurrent(2)
    }
    setCurrent(3);
    // }
  }

  const steps = [
    {
      title: '2. Confirm location',
      okText: "Okay",
      onOk: () => handlePhoneVerify(),
      onCancel: () => null,
      content: [
        <>
          <p>
            Due to regulatory restrictions, only users in authorized regions are able to access JetGovern. <a>Read more</a>
          </p>
          <p><strong>
            This information is never stored with us or our SMS verification partner, and is used solely for regional access.
          </strong></p>
          <Input />
        </>],
      closable: false
    }, {
      title: '3. Enter your secure access code',
      okText: "Okay",
      onOk: () => handleConfirmCode(),
      onCancel: () => null,
      content: [
        <>
          <p>You will receive a secure access code via SMS. Enter the code here to proceed.</p>
          <Input />
        </>],
      closable: false
    }, {
      title: 'Access Denied',
      okText: "Okay",
      onOk: () => null,
      onCancel: () => null,
      okButtonProps: { style: { display: "none " } },
      content: [<p>You have been denied access to JetGovern.</p>],
      closable: false
    }, {
      title: 'Stake Jet to begin voting',
      okText: "Okay",
      onOk: () => onClose(),
      onCancel: () => onClose(),
      content: [
        <p>Your wallet has been verified and you now have full access to the app. You will not need to verify your location again to interact with JetGovern.</p>
      ],
      closable: true
    }
  ]

  return (
    <Modal
      title={steps[current].title}
      visible={visible}
      okText={steps[current].okText}
      onOk={steps[current].onOk}
      onCancel={steps[current].onCancel}
      closable={steps[current].closable}
      okButtonProps={steps[current].okButtonProps}
      cancelButtonProps={{ style: { display: "none " } }}
    >
      {steps[current].content}
    </Modal>
  );
}
