import { useWallet } from "@solana/wallet-adapter-react";
import { Modal, Input } from "antd";
import React, { useEffect, useState } from "react";
import { useConnectWallet } from "../../contexts/connectWallet";
import axios from "axios";

export const VerifyModal = ({
  visible,
  onClose,
  verified,
  authenticated,
}: {
  visible: boolean;
  onClose: () => void;
  verified: boolean;
  authenticated: boolean;
}) => {
  const [current, setCurrent] = useState(0);
  const { connected, disconnect, publicKey } = useWallet();
  const { setConnecting } = useConnectWallet();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [code, setCode] = useState("");

  useEffect(() => {
    if (publicKey && authenticated) {
      if (verified) {
        return onClose();
      } else if (!verified) {
        return setCurrent(3);
      }
    } else if (publicKey && !authenticated) {
      return setCurrent(1);
    }
  }, [publicKey, verified, authenticated, setConnecting, onClose]);

  const handleInputPhoneNumber = (e: string) => {
    setPhoneNumber(e);
  };
  const enterKeyPhoneVerify = (e: any) => {
    if (e.code === "Enter") {
      handlePhoneVerify();
    }
  };
  const handlePhoneVerify = () => {
    // auth/sms begin a new SMS verification session
    // axios
    //   .put("https://api.jetprotocol.io/v1/auth/sms", {
    //     originator: "Governance",
    //     phoneNumber: phoneNumber,
    //   })
    //   .then((res) => {
    //     console.log(res.data);
    //     if (res.data === 201) {
    //       // Successfully sent SMS verification code
    //       setCurrent(2);
    //     } else if (res.data === 400) {
    //       // Payload validation failed or provided phone number was not a valid mobile number.
    //     } else if (res.data === 403) {
    //       // The provided mobile number originates from a geo-banned region.
    //       setCurrent(3);
    //     } else if (res.data === 500) {
    //       // Unknown or MessageBird API error.
    //     }
    //   })
    //   .catch(console.error);

    setCurrent(2);
  };

  const handleInputCode = (e: string) => {
    setCode(e);
  };
  const enterKeyInputCode = (e: any) => {
    if (e.code === "Enter") {
      handleConfirmCode();
    }
  };
  const handleConfirmCode = () => {
    // auth/sms/verify verify SMS token
    // axios
    //   .post("https://api.jetprotocol.io/v1/auth/sms/verify", {
    //   "network": "mainnet-beta",
    //   "publicKey": "string",
    //   "token": code,
    //   "verificationId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    // })
    //   .then((res) => {
    //     console.log(res.data);
    //     if (res.data === 204) {
    //       // The verification was successful and transaction was confirmed.
    //       setCurrent(4)
    //     } else if (res.data === 400) {
    //       // Payload validation failed.
    //       setCurrent(3)
    //     } else if (res.data === 500) {
    //       // Unknown or MessageBird API error.
    //       setCurrent(6)
    //     }
    //   })
    //   .catch(console.error);

    setCurrent(4);
  };

  const handleAccessDenied = () => {
    // Disconnect user and close all modals.
    disconnect();
    onClose();
    setConnecting(false);
  };

  const handleAuthenticate = () => {
    if (connected && !authenticated) {
      setCurrent(3);
    } else if (!connected) {
      setConnecting(true);
      onClose();
    }
  };

  const steps = [
    // 0: Init
    {
      title: "Stake your JET to earn rewards and start voting today!",
      okText: "Okay",
      onOk: () => handleAuthenticate(),
      onCancel: () => handleAuthenticate(),
      content: [
        <>
          <p>
            Welcome to Jet Govern—the governance app for Jet Protocol. Here, you
            earn rewards and help pilot the direction of Jet Protocol by staking
            your JET into the app.
          </p>

          <p>
            To start voting, connect your wallet and deposit some JET today!
          </p>
        </>,
      ],
      closable: connected && !authenticated ? true : false,
    },
    // 1: Confirm location
    {
      title: "Confirm location",
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
          <Input
            onChange={(e) => handleInputPhoneNumber(e.target.value)}
            onKeyPress={(e) => enterKeyPhoneVerify(e)}
          />
        </>,
      ],
      closable: false,
    },
    // 2
    {
      title: "Enter your secure access code",
      okText: "Okay",
      onOk: () => handleConfirmCode(),
      onCancel: () => null,
      content: [
        <>
          <p>
            You will receive a secure access code via SMS. Enter the code here
            to proceed.
          </p>
          <Input
            onChange={(e) => handleInputCode(e.target.value)}
            onKeyPress={(e) => enterKeyInputCode(e)}
          />
        </>,
      ],
      closable: false,
    },
    // 3
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
    // 4
    {
      title: "Stake JET to earn and vote!",
      okText: "Okay",
      onOk: () => setCurrent(5),
      onCancel: () => onClose(),
      okButtonProps: "Okay",
      content: [
        <>
          <p>
            Your wallet has been verified and you now have full access to the
            JetGovern module. You will not need to verify again.
          </p>

          <p>
            To begin, make sure you have some JET tokens staked. Once they are
            staked, you will begin earning rewards and may vote on active
            proposals (1 staked JET token = 1 vote).
          </p>
        </>,
      ],
      closable: true,
    },
    // 5
    {
      title: "Unstaking from the module",
      okText: "Okay",
      onOk: () => onClose(),
      onCancel: () => onClose(),
      okButtonProps: "Okay",
      content: [
        <>
          <p>
            When unstaking from JetGovern, your tokens enter a 29.5-day
            unbonding period.
          </p>
          <p>During the unbonding period, you will not earn any rewards.</p>
          <p>
            Additionally, votes you have cast on any active proposals will be
            rescinded. This means that if you vote and then unstake before the
            voting is finished, your vote will not count.
          </p>
          <p>
            To make sure your vote counts, only unstake once a vote has
            completed! For more information check out our <a>docs</a>.
          </p>
        </>,
      ],
      closable: true,
    },
    // 6
    {
      title: "Please try again",
      okText: "Okay",
      onOk: () => onClose(),
      onCancel: () => onClose(),
      okButtonProps: "Okay",
      content: [<p>We have encountered an unknown error, please try again.</p>],
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
