import { useWallet } from "@solana/wallet-adapter-react";
import { Modal, Input } from "antd";
import React, { useEffect, useState } from "react";
import { useConnectWallet } from "../../contexts/connectWallet";

export const VerifyModal = (props: {
  visible: boolean;
  onClose: () => void;
  verified: boolean;
  authenticated: boolean;
}) => {
  const { visible, onClose, verified, authenticated } = props;
  const [current, setCurrent] = useState(0);
  const { connected, disconnect, publicKey } = useWallet();
  const { setConnecting } = useConnectWallet();

  useEffect(() => {
    if (authenticated && !verified) {
      return setCurrent(3);
    } else if (authenticated && verified) {
      return onClose();
    }
  }, [publicKey, verified, authenticated, setConnecting, onClose]);

  const handlePhoneVerify = () => {
    setCurrent(2);
  };

  const handleConfirmCode = () => {
    if (authenticated && !verified) {
      return setCurrent(3);
    }
    setCurrent(3);
  };

  const handleAccessDenied = () => {
    // Disconnect user and close all modals.
    disconnect();
    onClose();
    setConnecting(false);
  };

  const handleAuthenticate = () => {
    if (connected && !authenticated) {
      setCurrent(3)
    } else if (!connected) {
      setConnecting(true)
      onClose();
    }
  }

  const steps = [
    {
      title: "Stake your JET to earn rewards and start voting today!",
      okText: "Okay",
      onOk: () => handleAuthenticate(),
      onCancel: () => handleAuthenticate(),
      content: [
        <>
          <p>
          Welcome to Jet Govern—the governance app for Jet Protocol. Here, you earn rewards and help pilot the direction of Jet Protocol by staking your JET into the app.
          </p>

          <p>
            To start voting, connect your wallet and deposit some JET today!
          </p>
        </>,
      ],
      closable: connected && !authenticated ? true : false,
    },
    {
      title: "2. Confirm location",
      okText: "Okay",
      onOk: () => handlePhoneVerify(),
      onCancel: () => null,
      content: [
        <>
          <p>
            Due to regulatory restrictions, only users in authorized regions are
            able to access JetGovern. <a>Read more</a>
          </p>
          <p>
            <strong>
              This information is never stored with us or our SMS verification
              partner, and is used solely for regional access.
            </strong>
          </p>
          <Input />
        </>,
      ],
      closable: false,
    },
    {
      title: "3. Enter your secure access code",
      okText: "Okay",
      onOk: () => handleConfirmCode(),
      onCancel: () => null,
      content: [
        <>
          <p>
            You will receive a secure access code via SMS. Enter the code here
            to proceed.
          </p>
          <Input />
        </>,
      ],
      closable: false,
    },
    {
      title: "Access Denied",
      okText: "Okay",
      onOk: () => handleAccessDenied(),
      onCancel: () => handleAccessDenied(),
      okButtonProps: "Okay",
      content: [
        <p>
          JetGovern is not available in your area. You will now be disconnected,
          but can continue to browse while disconnected.
        </p>,
      ],
      closable: true,
    },
  ];

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
      {steps[current].content}
    </Modal>
  );
};
