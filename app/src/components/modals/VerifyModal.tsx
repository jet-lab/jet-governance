import { Modal, Input } from "antd";
import { access } from "fs";
import React, { useEffect, useState } from "react";
import { notify } from "../../utils";

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
    setCurrent(3);
    // }
  }

  const handleCompleteVerify = () => {
    if (!verified) {
      return setCurrent(2)
    }
  }

  const steps = [
    {
      title: 'Region verification required',
      okText: "Okay",
      onOk: () => handlePhoneVerify(),
      onCancel: () => onClose(),
      content: `To access Jet Govern, enter your number below to verify that you're located in an authorized region.`,
      closable: true
    }, {
      title: 'Enter your secure access code',
      okText: "Okay",
      onOk: () => handleConfirmCode(),
      onCancel: () => onClose(),
      content: 'You will receive a secure access code via SMS. Enter the secure access code here to access Jet Govern.',
      closable: true
    }, {
      title: 'Access Denied',
      okText: "Okay",
      onOk: () => {},
      onCancel: () => null,
      content: 'Please select a vote.',
      closable: false
    }, {
      title: 'Stake Jet to begin voting',
      okText: "Okay",
      onOk: () => onClose(),
      onCancel: () => onClose(),
      content: `Your wallet has been verified and you now have full access to the app. You will not need to verify your location again to interact with Jet Govern.`,
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
      cancelButtonProps={{ style: { display: "none " } }}
    >
      {/* <p>To access Jet Govern, enter your number below to verify that you're located in an authorized region.</p>

      <p>This information is never stored or tracked, and is used solely for regional access.</p> */}

      <p>{steps[current].content}</p>
      <Input />

{/* 
      <Modal
      title="Enter your secure access code"
      visible={accessCode}
      okText="Okay"
      onOk={handleConfirmCode}
      onCancel={() => null}
      closable={false}
      cancelButtonProps={{ style: { display: "none " } }}
    >
      <p>You will receive a secure access code via SMS. Enter the secure access code here to access Jet Govern.</p>

      <Input />
      </Modal>

      <Modal
      title="Access Denied"
      visible={!verified && accessGrantedModal}
      onOk={() => null}
      okButtonProps={{ style: { display: "none " } }}
      onCancel={() => null}
      cancelButtonProps={{ style: { display: "none " } }}
      closable={false}
    >
      <p>Your wallet has been denied access to the app based on regional bans.</p>
      </Modal>

      <Modal
      title="Stake Jet to begin voting"
      visible={verified && accessGrantedModal}
      okText="Okay"
      onOk={handleCompleteVerify}
      onCancel={handleCompleteVerify}
      cancelButtonProps={{ style: { display: "none " } }}
    >
        <p>Your wallet has been verified and you now have full access to the app. You will not need to verify your location again to interact with Jet Govern.</p>
        <p>To begin voting, you'll need to stake some JET tokens (1 staked JET token = 1 vote)</p>
      </Modal>

      </> */}

    </Modal>
  );
}
