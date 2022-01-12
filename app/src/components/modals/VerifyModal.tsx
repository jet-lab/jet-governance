import { Modal, Input } from "antd";
import { access } from "fs";
import React, { useState } from "react";
import { notify } from "../../utils";

export const VerifyModal = (props: {
  verified: boolean;
  setVerified: () => void;
  doNotInit: () => void;
}) => {
  const { verified, setVerified, doNotInit } = props;
  const [smsModal, setSmsModal] = useState(true);
  const [accessCode, setAccessCode] = useState(false);
  const [accessGrantedModal, setAccessGrantedModal] = useState(false);

  const handlePhoneVerify = () => {
    setSmsModal(false);
    setAccessCode(true)
  }

  const handleConfirmCode = () => {
    setAccessCode(false);
    setAccessGrantedModal(true);
    if (Math.floor(Math.random() * 2) == 0) {
      setVerified();
    }
  }

  const handleCompleteVerify = () => {
    if (!verified) {
    // TODO add init app boolean
      notify({
        message: 'Checking eligibility',
        description: 'You cannot access Jet Govern',
      });
      doNotInit();
    }
    setAccessGrantedModal(false);
  }

  return (
    <>
    
    <Modal
      title="Region verification required"
      visible={smsModal}
      okText="Okay"
      onOk={handlePhoneVerify}
      onCancel={() => null}
      closable={false}
      cancelButtonProps={{ style: { display: "none " } }}
    >
      <p>To access Jet Govern, enter your number below to verify that you're located in an authorized region.</p>

      <p>This information is never stored or tracked, and is used solely for regional access.</p>

      <Input />
      </Modal>

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
      okText="Okay"
      onOk={handleCompleteVerify}
      onCancel={handleCompleteVerify}
      cancelButtonProps={{ style: { display: "none " } }}
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
        <p>Your wallet has been verified and you now have full access to the app. You will not need to verify your location again to interact with Jet Govern.</p>
        <p>Your wallet has been verified and you now have full access to the app. You will not need to verify your location again to interact with Jet Govern.</p>
      </Modal>

      </>
  );
};
