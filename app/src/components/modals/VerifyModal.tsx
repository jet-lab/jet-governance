import { useWallet } from "@solana/wallet-adapter-react";
import { Modal, Input, ModalProps } from "antd";
import { PropsWithChildren, useEffect, useState } from "react";
import { useConnectWallet } from "../../contexts/connectWallet";
import axios from "axios";
import { useConnection, useConnectionConfig } from "../../contexts";
import { Auth } from "@jet-lab/jet-engine/lib/auth/auth";
import CountryPhoneInput, { CountryPhoneInputValue } from "antd-country-phone-input";
import { DocsLink } from "../docsLink";
import { ReactComponent as ArrowIcon } from "../../images/arrow_icon.svg";
import { geoBannedCountries } from "../../models/GEOBANNED_COUNTRIES";
import { filterSort } from "../../utils";
import { createUserAuth } from "../../actions/createUserAuth";
import { useProvider, useRpcContext } from "../../hooks";

enum Steps {
  Welcome = 0,
  ConnectWallet = 1,
  ConfirmLocation = 2,
  EnterSMSCode = 3,
  AccessDenied = 4,
  AccessGranted1 = 5,
  AccessGranted2 = 6,
  UnknownError = 7,
  PhoneInvalid = 8,
  VpnBlocked = 9,
  InvalidToken = 10,
  RegionNotSupported = 11
}
const API_KEY: string = process.env.REACT_APP_SMS_AUTH_API_KEY!;

export const VerifyModal = () => {
  const [current, setCurrent] = useState<Steps>(Steps.Welcome);
  const { wallets, select, disconnect, disconnecting, wallet, publicKey } = useWallet();
  const { connecting, setConnecting } = useConnectWallet();
  const rpcContext = useRpcContext();

  const connection = useConnection();
  const provider = useProvider(connection, wallet);
  const authProgram = Auth.useAuthProgram(provider);
  const { authAccount, loading: authAccountLoading } = Auth.useAuthAccount(authProgram, publicKey);

  const [phoneNumber, setPhoneNumber] = useState<CountryPhoneInputValue>({ short: "CH" });
  const [isGeobanned, setIsGeobanned] = useState(false);
  const [country, setCountry] = useState("");
  // The ID of the SMS verification session with MessageBird.
  const [verificationId, setVerificationId] = useState<string>();
  // The verification token received from the SMS recipient.
  const [code, setCode] = useState("");
  const [confirmCodeLoading, setConfirmCodeLoading] = useState(false);
  const { env } = useConnectionConfig();

  function setAuthorizationConfirmed(confirmed: boolean) {
    if (publicKey) {
      localStorage.setItem(`authConfirmed:${publicKey.toBase58()}`, JSON.stringify(confirmed));
    }
  }

  useEffect(() => {
    // Get user's IP to determine location/geobanning
    async function getIP() {
      const ipKey = process.env.REACT_APP_IP_REGISTRY;
      let locale: any = null;

      try {
        const resp = await fetch(`https://api.ipregistry.co/?key=${ipKey}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });

        locale = await resp.json();
        const countryCode = locale.location.country.code;
        geoBannedCountries.forEach(c => {
          if (c.code === countryCode) {
            // If country is Ukraine, checks if first two digits
            // of the postal code further match Crimean postal codes.
            if (countryCode !== "UA" || isCrimea(locale)) {
              setIsGeobanned(true);
              setCountry(c.country);
            }
          }
        });
        setPhoneNumber({ short: locale.location.country.code });
      } catch (err) {
        console.log(err);
      }
    }

    // Check to see if user's locale is special case of Crimea
    const isCrimea = (locale: any) => {
      // Crimea region code for ipregistry is UA-43
      return locale.location.region.code === "UA-43";
    };

    getIP();
  }, []);

  useEffect(() => {
    function getAuthorizationConfirmed() {
      return (
        publicKey &&
        JSON.parse(localStorage.getItem(`authConfirmed:${publicKey.toBase58()}`) ?? "false") ===
          true
      );
    }
    function onStepOrClosed(step: Steps) {
      return current === step || !connecting;
    }
    if (onStepOrClosed(Steps.ConnectWallet) && !disconnecting && !authAccountLoading) {
      if (!authAccount || !authAccount.userAuthentication.complete) {
        if (isGeobanned) {
          setCurrent(Steps.RegionNotSupported);
        } else {
          setCurrent(Steps.ConfirmLocation);
          setConnecting(true);
        }
      } else if (authAccount.userAuthentication.allowed) {
        if (getAuthorizationConfirmed()) {
          setConnecting(false);
          setCurrent(Steps.Welcome);
        } else {
          setCurrent(Steps.AccessGranted1);
          setConnecting(true);
        }
      } else if (!authAccount.userAuthentication.allowed) {
        setCurrent(Steps.AccessDenied);
        setConnecting(true);
      }
    }
  }, [
    authAccount,
    authAccountLoading,
    connecting,
    current,
    disconnecting,
    isGeobanned,
    publicKey,
    setConnecting
  ]);

  const handleInputPhoneNumber = (e: CountryPhoneInputValue) => {
    setPhoneNumber(e);
  };

  const enterKeyPhoneVerify = (e: any) => {
    if (e.code === "Enter") {
      handlePhoneVerify();
    }
  };

  const createAuthAccount = async () => {
    if (authAccountLoading || !authProgram || !publicKey) {
      return false;
    }

    // If the auth account is created, do not create it again
    if (authAccount) {
      return true;
    }

    try {
      await createUserAuth(rpcContext, authProgram, publicKey, publicKey);
      return true;
    } catch (err) {
      console.error(err);
      setCurrent(Steps.UnknownError);
      return false;
    }
  };

  const handlePhoneVerify = async () => {
    if (await createAuthAccount() === false) {
      return;
    }

    // auth/sms begin a new SMS verification session
    axios
      .put(
        "https://api.jetprotocol.io/v1/auth/sms",
        {
          originator: "Governance",
          phoneNumber: `+${phoneNumber.code}${phoneNumber.phone}`
        },
        {
          headers: {
            Authorization: API_KEY
          }
        }
      )
      .then(res => {
        console.log(res.status, res.data);
        if (res.status === 201) {
          // Successfully sent SMS verification code
          setVerificationId(res.data.id);
          setCurrent(Steps.EnterSMSCode);
        } else {
          console.log("error", res);
          setCurrent(Steps.UnknownError);
        }
      })
      .catch(err => {
        console.error(JSON.stringify(err), err?.response?.body, err?.response?.data);
        console.error("response status", err.response.status);
        if (err.response.status === 400) {
          // Payload validation failed or provided phone number was not a valid mobile number.
          setCurrent(Steps.PhoneInvalid);
        } else if (err.response.status === 403) {
          // The provided mobile number originates from a geo-banned region.
          if (
            err?.response?.data.error[0] ===
            "the ip of the requester has been detected as a threat or anonymized."
          ) {
            console.error("VPN blocked");
            setCurrent(Steps.VpnBlocked);
          } else if (
            err?.response?.data.error[0] ===
            "the ip of the requester has been detected as originating from a geo-banned region."
          ) {
            console.error("You are attempting to access Jet Govern from an unavailable region.");
            setCurrent(Steps.AccessDenied);
          } else {
            setCurrent(Steps.UnknownError);
          }
        } else if (err.response.status === 423) {
          // The provided mobile number originates from a geo-banned region.
          setCurrent(Steps.AccessDenied);
        } else if (err.response.status === 500) {
          // Unknown or MessageBird API error.
          setCurrent(Steps.UnknownError);
        } else {
          setCurrent(Steps.UnknownError);
        }
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
    if (!publicKey) {
      setCurrent(Steps.UnknownError);
      return;
    }
    // auth/sms/verify verify SMS token
    setConfirmCodeLoading(true);
    axios
      .post(
        "https://api.jetprotocol.io/v1/auth/sms/verify",
        {
          network: env,
          publicKey: Auth.deriveUserAuthentication(publicKey),
          token: code,
          verificationId: verificationId
        },
        {
          headers: {
            Authorization: API_KEY
          }
        }
      )
      .then(res => {
        console.log(res.status, res.data);
        setConfirmCodeLoading(false);
        if (res.status === 204) {
          // The verification was successful and transaction was confirmed.
          setCurrent(Steps.AccessGranted1);
        } else if (res.status === 400) {
          // Payload validation failed.
          console.log("Payload validation failed");
          setCurrent(Steps.AccessDenied);
        } else if (res.status === 500) {
          // Unknown or MessageBird API error.
          setCurrent(Steps.UnknownError);
        }
      })
      .catch(err => {
        console.error(JSON.stringify(err), err?.response?.body, err?.response?.data);
        setConfirmCodeLoading(false);
        if (err.response.status === 400) {
          // Payload validation failed or provided phone number was not a valid mobile number.
          setCurrent(Steps.InvalidToken);
        } else if (err.response.status === 403) {
          // The provided mobile number originates from a geo-banned region.
          if (
            err?.response?.data.error[0] ===
            "the ip of the requester has been detected as a threat or anonymized."
          ) {
            console.error("VPN blocked");
            setCurrent(Steps.VpnBlocked);
          } else {
            console.error("You are attempting to access Jet Govern from an unavailable region.");
            setCurrent(Steps.AccessDenied);
          }
        } else if (err.response.status === 500) {
          if (
            err?.response?.data.error[0] ===
            "api error(s): The token is invalid. (code: 10, parameter: token)"
          ) {
            // Token is invalid
            console.error("Invalid token");
            setCurrent(Steps.InvalidToken);
          } else {
            // Unknown or MessageBird API error.
            setCurrent(Steps.UnknownError);
          }
        } else {
          setCurrent(Steps.UnknownError);
        }
      });
  };

  const handleDisconnect = () => {
    // Disconnect user and close all modals.
    disconnect();
    setConnecting(false);
  };

  const handleAccessGranted = () => {
    setAuthorizationConfirmed(true);
    setConnecting(false);
  };

  const steps: PropsWithChildren<ModalProps>[] = [];
  steps[Steps.Welcome] = {
    title: "Stake your JET to earn rewards and start voting today!",
    okText: "Okay",
    okButtonProps: {},
    onOk: () => setCurrent(Steps.ConnectWallet),
    onCancel: () => handleDisconnect(),
    cancelButtonProps: { style: { display: "none " } },
    children: (
      <div className="flex column">
        <p>
          Welcome to Jet Govern—the governance app for Jet Protocol. Here, you earn rewards and help
          pilot the direction of Jet Protocol by staking your JET into the app.
        </p>

        <p>To start voting, connect your wallet and deposit some JET today!</p>
      </div>
    ),
    closable: false
  };
  steps[Steps.ConnectWallet] = {
    footer: null,
    title: "Connect wallet",
    onCancel: () => handleDisconnect(),
    cancelButtonProps: { style: { display: "none " } },
    children: (
      <div className="connect-wallet-modal flex-centered column">
        <span>
          <strong>Vote</strong>, <strong>earn rewards</strong>, and{" "}
          <strong>check for airdrops</strong> by connecting your wallet.
        </span>
        <div className="divider"></div>
        <div className="wallets flex-centered column">
          {wallets.map(w => (
            <div
              key={w.name}
              className={`wallet flex align-center justify-between
                ${wallet?.name === w.name ? "active" : ""}`}
              onClick={() => {
                select(w.name);
              }}
            >
              <div className="flex-centered">
                <img
                  src={`img/wallets/${w.name.toLowerCase()}.png`}
                  width="30px"
                  height="auto"
                  alt={`${w.name} Logo`}
                />
                <p className="center-text">{w.name}</p>
              </div>
              <ArrowIcon width="25px" />
            </div>
          ))}
        </div>
      </div>
    )
  };
  steps[Steps.ConfirmLocation] = {
    title: "Confirm location",
    okText: "Send SMS",
    okButtonProps: {
      disabled: authAccountLoading || phoneNumber.phone === undefined
    },
    onOk: () => handlePhoneVerify(),
    onCancel: () => handleDisconnect(),
    cancelButtonProps: { style: { display: "none " } },
    children: (
      <div className="flex column">
        <p>
          Due to regulatory restrictions, only users in authorized regions are able to access
          JetGovern. For more info, see our{" "}
          <a
            href="https://www.jetprotocol.io/legal/terms-of-service"
            target="_blank"
            rel="noreferrer"
          >
            Terms of Use
          </a>
          .
        </p>
        <p>
          <strong>
            This information is never stored with us or our SMS verification partner, and is used
            solely for regional verification.
          </strong>
        </p>
        <p>
          As this verification happens on-chain, you will need SOL for your verification
          transaction.
        </p>
        <CountryPhoneInput
          placeholder={"Phone number"}
          value={phoneNumber}
          onChange={(e: CountryPhoneInputValue) => handleInputPhoneNumber(e)}
          selectProps={{ filterSort }}
          onKeyPress={(e: any) => enterKeyPhoneVerify(e)}
          type={"number"}
        />
      </div>
    ),
    closable: false
  };
  steps[Steps.EnterSMSCode] = {
    title: "Enter your secure access code",
    okText: "Submit",
    okButtonProps: { loading: confirmCodeLoading },
    onOk: () => handleConfirmCode(),
    onCancel: () => handleDisconnect(),
    cancelButtonProps: { style: { display: "none " } },
    children: (
      <div className="flex column">
        <p>You will receive a secure access code via SMS. Enter the code here to proceed.</p>
        <Input
          onChange={e => handleInputCode(e.target.value)}
          onKeyPress={e => enterKeyInputCode(e)}
          maxLength={6}
          type={"number"}
        />
      </div>
    ),
    closable: false
  };
  steps[Steps.AccessDenied] = {
    title: "Access Denied",
    okText: "Disconnect",
    cancelText: "Disconnect",
    onOk: () => handleDisconnect(),
    onCancel: () => handleDisconnect(),
    cancelButtonProps: { style: { display: "none " } },
    children: (
      <p>
        JetGovern is not available in your area. Your wallet will now be disconnected, but you may
        continue to browse proposals while disconnected.
      </p>
    ),
    closable: true
  };
  steps[Steps.AccessGranted1] = {
    title: "Stake JET to earn and vote!",
    okText: "Okay",
    onOk: () => setCurrent(Steps.AccessGranted2),
    onCancel: () => handleAccessGranted(),
    cancelButtonProps: { style: { display: "none " } },
    children: (
      <div className="flex column">
        <p>
          Your wallet has been verified and you now have full access to the JetGovern module. You
          will not need to verify again.
        </p>
        <p>
          To begin, make sure you have some JET tokens staked. Once they are staked, you will begin
          earning rewards and may vote on active proposals (1 staked JET token = 1 vote).
        </p>
      </div>
    ),
    closable: true
  };
  steps[Steps.AccessGranted2] = {
    title: "Unstaking from the module",
    okText: "Okay",
    onOk: () => handleAccessGranted(),
    onCancel: () => handleAccessGranted(),
    cancelButtonProps: { style: { display: "none " } },
    children: (
      <div className="flex column">
        <p>When unstaking from JetGovern, your tokens enter a 29.5-day unbonding period.</p>
        <p>During the unbonding period, you will not earn any rewards.</p>
        <p>
          Additionally, votes you have cast on any active proposals will be rescinded. This means
          that if you vote and then unstake before the voting is finished, your vote will not count.
        </p>
        <p>
          To make sure your vote counts, only unstake once a vote has completed! For more
          information check out our <DocsLink>docs</DocsLink>.
        </p>
      </div>
    ),
    closable: true
  };
  steps[Steps.UnknownError] = {
    title: "Please try again",
    okText: "Okay",
    okButtonProps: undefined,
    cancelButtonProps: { style: { display: "none " } },
    onOk: () => handleDisconnect(),
    onCancel: () => handleDisconnect(),
    children: <p>We have encountered an unknown error, please try again.</p>,
    closable: true
  };
  steps[Steps.PhoneInvalid] = {
    title: "Phone number invalid",
    okText: "Okay",
    okButtonProps: undefined,
    cancelButtonProps: { style: { display: "none " } },
    onOk: () => setCurrent(Steps.ConfirmLocation),
    onCancel: () => handleDisconnect(),
    children: <p>Please check the area code and try entering your phone number again.</p>,
    closable: true
  };
  steps[Steps.VpnBlocked] = {
    title: "VPN detected",
    okText: "Okay",
    okButtonProps: undefined,
    cancelButtonProps: { style: { display: "none " } },
    onOk: () => setCurrent(Steps.ConfirmLocation),
    onCancel: () => handleDisconnect(),
    children: (
      <p>
        We have detected that you are using a VPN. Please turn off your VPN and try again to verify
        your wallet.
      </p>
    ),
    closable: true
  };
  steps[Steps.InvalidToken] = {
    title: "Invalid secure access code",
    okText: "Okay",
    okButtonProps: undefined,
    cancelButtonProps: { style: { display: "none " } },
    onOk: () => setCurrent(Steps.ConfirmLocation),
    onCancel: () => handleDisconnect(),
    children: <p>You have entered an invalid secure access code. Please try again.</p>,
    closable: true
  };
  steps[Steps.RegionNotSupported] = {
    title: "Just checking",
    cancelText: "Disconnect",
    okButtonProps: { style: { display: "none " } },
    onOk: () => handleDisconnect(),
    onCancel: () => handleDisconnect(),
    children: (
      <div className="flex column">
        <p>
          It looks like you may be trying to access Jet Govern from <b>{country}</b>.
        </p>
        <p>
          Due to regulatory restrictions, Jet Govern is not available to residents of certain
          countries. For more info, see the{"  "}
          <a
            href="https://www.jetprotocol.io/legal/terms-of-service"
            target="_blank"
            rel="noreferrer"
          >
            Terms of Service
          </a>
          .
        </p>
        <p>
          Your wallet will now be disconnected, but you may continue to browse proposals while
          disconnected.
        </p>
        <div className="emphasis">
          <p>
            If you think this might be incorrect, please ensure that your VPN is turned off for
            verification purposes.
          </p>
        </div>
      </div>
    ),
    closable: true
  };

  return <Modal visible={true} {...steps[current]} />;
};
