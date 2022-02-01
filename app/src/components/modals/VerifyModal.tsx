import { useWallet } from "@solana/wallet-adapter-react";
import { Modal, Input, ModalProps } from "antd";
import { ReactNode, useEffect, useState } from "react";
import { useConnectWallet } from "../../contexts/connectWallet";
import axios from "axios";
import { useConnectionConfig } from "../../contexts";
import { Auth } from "@jet-lab/jet-engine/lib/auth/auth";
import CountryPhoneInput, { CountryPhoneInputValue } from "antd-country-phone-input";

enum Steps {
  Welcome = 0,
  ConfirmLocation = 1,
  EnterSMSCode = 2,
  AccessDenied = 3,
  AccessGranted1 = 4,
  AccessGranted2 = 5,
  UnknownError = 6,
}

export const VerifyModal = ({
  visible,
  authAccount,
  authAccountLoading,
  createAuthAccount,
}: {
  visible: boolean;
  authAccount: Auth | undefined;
  authAccountLoading: boolean;
  createAuthAccount: () => Promise<boolean>
}) => {
  const [current, setCurrent] = useState<Steps>(Steps.Welcome);
  const { connected, disconnect } = useWallet();
  const { setConnecting, setWelcoming, setAuthorizationConfirmed } = useConnectWallet();
  const [phoneNumber, setPhoneNumber] = useState<CountryPhoneInputValue>({ short: 'US' });
  // The ID of the SMS verification session with MessageBird.
  const [verificationId, setVerificationId] = useState<string>()
  // The verification token received from the SMS recipient.
  const [code, setCode] = useState("");
  const [welcomeConfirmed, setWelcomeConfirmed] = useState(false);
  const [phoneVerifyLoading, setPhoneVerifyLoading] = useState(false)
  const [confirmCodeLoading, setConfirmCodeLoading] = useState(false)
  const { env } = useConnectionConfig()

  useEffect(() => {
    if (current === Steps.Welcome && welcomeConfirmed && !authAccountLoading) {
      if (!authAccount || !authAccount.userAuthentication.complete) {
        setWelcoming(false)
        setCurrent(Steps.ConfirmLocation)
      }
      else if (authAccount.userAuthentication.allowed) {
        setCurrent(Steps.AccessGranted1)

      } else {
        setCurrent(Steps.AccessDenied)
      }
    } else if (authAccount && authAccount.userAuthentication.complete) {
      if (authAccount.userAuthentication.allowed) {
        setAuthorizationConfirmed(true)
        setWelcomeConfirmed(false);
        setCurrent(Steps.Welcome)
      } else {
        setCurrent(Steps.AccessDenied)
      }
    }
  }, [authAccount, authAccountLoading, current, setWelcoming, welcomeConfirmed, setAuthorizationConfirmed])

  const handleInputPhoneNumber = (e: CountryPhoneInputValue) => {
    setPhoneNumber(e);
  };
  const enterKeyPhoneVerify = (e: any) => {
    if (e.code === "Enter") {
      handlePhoneVerify();
    }
  }
  const handlePhoneVerify = async () => {
    if (authAccountLoading) {
      return;
    }

    setPhoneVerifyLoading(true);

    if (!await createAuthAccount()) {
      setPhoneVerifyLoading(false)
      return;
    }

    // auth/sms begin a new SMS verification session
    axios
      .put("https://api.jetprotocol.io/v1/auth/sms", {
        originator: "Governance",
        phoneNumber: `+${phoneNumber.code}${phoneNumber.phone}`,
      })
      .then((res) => {
        console.log(res.status, res.data);
        setPhoneVerifyLoading(false)
        if (res.status === 201) {
          // Successfully sent SMS verification code
          setVerificationId(res.data.id)
          setCurrent(Steps.EnterSMSCode);
        } else if (res.status === 400) {
          // Payload validation failed or provided phone number was not a valid mobile number.
          setCurrent(Steps.EnterSMSCode);
        } else if (res.status === 403) {
          // The provided mobile number originates from a geo-banned region.
          console.log("Phone number geo-banned")
          setCurrent(Steps.AccessDenied);
        } else if (res.status === 500) {
          // Unknown or MessageBird API error.
          setCurrent(Steps.UnknownError);
        } else {
          setCurrent(Steps.UnknownError);
        }
      })
      .catch(err => {
        console.error(JSON.stringify(err), err?.response?.body, err?.response?.data)
        setPhoneVerifyLoading(false)
        setCurrent(Steps.UnknownError)
      });
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
    setConfirmCodeLoading(true)
    axios
      .post("https://api.jetprotocol.io/v1/auth/sms/verify", {
        "network": env,
        "publicKey": authAccount?.address.toBase58(),
        "token": code,
        "verificationId": verificationId
      })
      .then((res) => {
        console.log(res.status, res.data);
        setConfirmCodeLoading(false)
        if (res.status === 204) {
          // The verification was successful and transaction was confirmed.
          setCurrent(Steps.AccessGranted1)
        } else if (res.status === 400) {
          // Payload validation failed.
          console.log("Payload validation failed")
          setCurrent(Steps.AccessDenied)
        } else if (res.status === 500) {
          // Unknown or MessageBird API error.
          setCurrent(Steps.UnknownError)
        }
      })
      .catch(err => {
        console.error(JSON.stringify(err), err?.response?.body, err?.response?.data)
        setConfirmCodeLoading(false)
        setCurrent(Steps.UnknownError)
      });
  };

  const handleAccessDenied = () => {
    // Disconnect user and close all modals.
    disconnect();
    setConnecting(false);
    setAuthorizationConfirmed(true)
    setWelcomeConfirmed(false);
    setCurrent(Steps.Welcome)
  };

  const handleAccessGranted = () => {
    setAuthorizationConfirmed(true)
    setWelcomeConfirmed(false);
    setCurrent(Steps.Welcome)
  }

  const handleAuthenticate = () => {
    if (connected) {
      if (authAccount && authAccount.userAuthentication.complete) {
        if (authAccount.userAuthentication.allowed) {
          setCurrent(Steps.AccessGranted1);
        } else {
          setCurrent(Steps.AccessDenied);
        }
      } else {
        setWelcomeConfirmed(true);
      }
    } else {
      setConnecting(true);
      setWelcoming(false);
      setWelcomeConfirmed(true);
    }
  };

  const steps: (ModalProps & { content: ReactNode })[] = []
  steps[Steps.Welcome] = {
    title: "Stake your JET to earn rewards and start voting today!",
    okText: "Okay",
    okButtonProps: { loading: welcomeConfirmed },
    onOk: () => handleAuthenticate(),
    onCancel: () => handleAuthenticate(),
    content:
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
    closable: false,
  }
  steps[Steps.ConfirmLocation] = {
    title: "Confirm location",
    okText: "Okay",
    okButtonProps: {
      disabled: authAccountLoading,
      loading: phoneVerifyLoading
    },
    onOk: () => handlePhoneVerify(),
    onCancel: () => null,
    content:
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
        <CountryPhoneInput
          placeholder={"Phone number"}
          value={phoneNumber}
          onChange={(e: CountryPhoneInputValue) => handleInputPhoneNumber(e)}
          onKeyPress={(e: any) => enterKeyPhoneVerify(e)} />
      </>,
    closable: false,
  }
  steps[Steps.EnterSMSCode] = {
    title: "Enter your secure access code",
    okText: "Okay",
    okButtonProps: { loading: confirmCodeLoading },
    onOk: () => handleConfirmCode(),
    onCancel: () => null,
    content:
      <>
        <p>
          You will receive a secure access code via SMS. Enter the code here
          to proceed.
        </p>
        <Input
          onChange={(e) => handleInputCode(e.target.value)}
          onKeyPress={(e) => enterKeyInputCode(e)}
          maxLength={6}
        />
      </>,
    closable: false,
  }
  steps[Steps.AccessDenied] = {
    title: "Access Denied",
    okText: "Okay",
    onOk: () => handleAccessDenied(),
    onCancel: () => handleAccessDenied(),
    content:
      <p>
        JetGovern is not available in your area. You will now be disconnected,
        but can continue to browse while disconnected.
      </p>,
    closable: true,
  }
  steps[Steps.AccessGranted1] = {
    title: "Stake JET to earn and vote!",
    okText: "Okay",
    onOk: () => setCurrent(Steps.AccessGranted2),
    onCancel: () => setCurrent(Steps.AccessGranted2),
    content:
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
    closable: true,
  }
  steps[Steps.AccessGranted2] = {
    title: "Unstaking from the module",
    okText: "Okay",
    onOk: () => handleAccessGranted(),
    onCancel: () => handleAccessGranted(),
    content:
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
    closable: true,
  }
  steps[Steps.UnknownError] = {
    title: "Please try again",
    okText: "Okay",
    okButtonProps: undefined,
    onOk: () => handleAccessDenied(),
    onCancel: () => handleAccessDenied(),
    content:
      <p>
        We have encountered an unknown error, please try again.
      </p>,
    closable: true,
  }

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
