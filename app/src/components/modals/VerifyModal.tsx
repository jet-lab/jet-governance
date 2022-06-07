import { Auth } from "@jet-lab/jet-engine";
import { useWallet } from "@solana/wallet-adapter-react";
import { Modal, Input, ModalProps, Checkbox } from "antd";
import { CountryPhoneInput, CountryPhoneInputValue } from "antd-country-phone-input";
import axios from "axios";
import { PropsWithChildren, useEffect, useState } from "react";
import { DocsLink } from "../docsLink";
import { createUserAuth } from "../../actions/createUserAuth";
import { useConnectionConfig, useConnectWallet } from "../../contexts";
import { useProvider, useRpcContext } from "../../hooks";
import { ReactComponent as ArrowIcon } from "../../images/arrow_icon.svg";
import { geoBannedCountries } from "../../models/GEOBANNED_COUNTRIES";
import { filterSort } from "../../utils";
import { REWARDS_ENABLED, LABELS } from "../../constants";

enum Steps {
  Welcome = 0,
  ConnectWallet = 1,
  ConfirmLocation = 2,
  EnterSMSCode = 3,
  AccessDenied = 4,
  AgreeToTerms = 5,
  AccessGranted1 = 6,
  AccessGranted2 = 7,
  UnknownError = 8,
  PhoneInvalid = 9,
  OriginRestricted = 10,
  InvalidToken = 11,
  RegionNotSupported = 12,
  LocationUndetected = 13
}
const API_KEY: string = process.env.REACT_APP_SMS_AUTH_API_KEY!;

export const VerifyModal = () => {
  const [current, setCurrent] = useState<Steps>(Steps.Welcome);
  const { wallets, select, disconnect, disconnecting, wallet, publicKey } = useWallet();
  const { connecting, setConnecting } = useConnectWallet();
  const rpcContext = useRpcContext();

  const provider = useProvider();
  const authProgram = Auth.useAuthProgram(provider);
  const { authAccount, loading: authAccountLoading } = Auth.useAuthAccount(authProgram, publicKey);

  const [phoneNumber, setPhoneNumber] = useState<CountryPhoneInputValue>({ short: "CH" });
  const [isGeobanned, setIsGeobanned] = useState(false);
  const [disclaimerChecked, setDisclaimerChecked] = useState(false);
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
        const countryCode = locale.location.country.code ?? undefined;
        if (!countryCode) {
          setCountry("unknown");
        }
        geoBannedCountries.forEach(c => {
          if (c.code === countryCode) {
            // If country is Ukraine, checks if in Crimea.
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
    function getAgreedToTerms() {
      return (
        publicKey && JSON.parse(localStorage.getItem(`jetGovernTermsAccepted`) ?? "false") === true
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
        }
      } else if (authAccount.userAuthentication.allowed) {
        if (getAuthorizationConfirmed() && getAgreedToTerms()) {
          setConnecting(false);
        } else {
          setCurrent(Steps.AgreeToTerms);
        }
      } else if (!authAccount.userAuthentication.allowed) {
        setCurrent(Steps.AccessDenied);
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
    if ((await createAuthAccount()) === false) {
      return;
    }

    if (country === "unknown") {
      return setCurrent(Steps.LocationUndetected);
    }

    if (!publicKey) {
      setCurrent(Steps.UnknownError);
      return;
    }

    // auth/sms begin a new SMS verification session

    axios
      .put(
        "https://api.jetprotocol.io/v1/auth/sms/create",
        {
          phoneNumber: `+${phoneNumber.code}${phoneNumber.phone}`,
          network: env,
          publicKey: Auth.deriveUserAuthentication(publicKey)
        },
        {
          headers: {
            Authorization: API_KEY
          }
        }
      )
      .then(res => {
        if (res.status === 201) {
          // Successfully sent SMS verification code
          setVerificationId(res.data.id);
          setCurrent(Steps.EnterSMSCode);
        } else if (res.status === 204) {
          setCurrent(Steps.AgreeToTerms);
        } else {
          console.log("error", res);
          setCurrent(Steps.UnknownError);
        }
      })
      .catch(err => {
        console.error(err?.response?.data);
        if (err.response.status === 400) {
          // Payload validation failed or provided phone number was not a valid mobile number.
          setCurrent(Steps.PhoneInvalid);
        } else if (err.response.status === 403) {
          // The provided mobile number originates from a geo-banned region.
          if (
            err?.response?.data.error[0] ===
            "the ip of the requester has been detected as a threat or anonymized."
          ) {
            setCurrent(Steps.OriginRestricted);
          } else if (
            err?.response?.data.error[0] ===
            "the ip of the requester has been detected as originating from a geo-banned region."
          ) {
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
          phoneNumber: `+${phoneNumber.code}${phoneNumber.phone}`
        },
        {
          headers: {
            Authorization: API_KEY
          }
        }
      )
      .then(res => {
        setConfirmCodeLoading(false);
        if (res.status === 204) {
          // The verification was successful and transaction was confirmed.
          setCurrent(Steps.AgreeToTerms);
        } else if (res.status === 400) {
          // Payload validation failed.
          setCurrent(Steps.AccessDenied);
        } else if (res.status === 500) {
          // Unknown or MessageBird API error.
          setCurrent(Steps.UnknownError);
        }
      })
      .catch(err => {
        console.error(err?.response?.data);
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
            setCurrent(Steps.OriginRestricted);
          } else {
            setCurrent(Steps.AccessDenied);
          }
        } else if (err.response.status === 500) {
          if (
            err?.response?.data.error[0] ===
            "api error(s): The token is invalid. (code: 10, parameter: token)"
          ) {
            // Token is invalid
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

  const handleAcceptTerms = () => {
    localStorage.setItem("jetGovernTermsAccepted", "true");
    setCurrent(Steps.AccessGranted1);
  };

  const steps: PropsWithChildren<ModalProps>[] = [];

  steps[Steps.Welcome] = {
    title: REWARDS_ENABLED ? LABELS.WELCOME_TITLE_WITH_REWARDS : LABELS.WELCOME_TITLE_NO_REWARDS,
    okText: "Okay",
    okButtonProps: {},
    onOk: () => setCurrent(Steps.ConnectWallet),
    onCancel: () => handleDisconnect(),
    cancelButtonProps: { style: { display: "none " } },
    children: (
      <div className="flex column">
        <p>
          {REWARDS_ENABLED
            ? LABELS.WELCOME_PARAGRAPH_WITH_REWARDS
            : LABELS.WELCOME_PARAGRAPH_NO_REWARDS}
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
            href="https://jet-association.gitbook.io/jet-association-1.0.0/terms-of-service"
            className="link-btn"
            target="_blank"
            rel="noopener noreferrer"
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
          If you are experiencing difficulties, please take a look at the{" "}
          <a
            href="https://jet-association.gitbook.io/jet-association-1.0.0/sms-verification-troubleshooting-guide"
            className="link-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            troubleshooting guide
          </a>
          .
        </p>
        <p>This verification happens on-chain and you will need SOL for your transaction.</p>
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
      <div className="flex column">
        <p>
          JetGovern is not available in your area. Users from certain regions are not permitted to
          stake or vote, but may still view proposals and voting results. Your wallet will now be
          disconnected.
        </p>
        <p>
          If you believe that you are receiving this message in error, you may be using a VPN.
          Please turn off your VPN to complete SMS verification for your wallet.
        </p>
      </div>
    ),
    closable: false
  };
  steps[Steps.AgreeToTerms] = {
    title: "Warning",
    okText: "Accept",
    okButtonProps: { disabled: !disclaimerChecked },
    onOk: () => handleAcceptTerms(),
    cancelButtonProps: { style: { display: "none " } },
    onCancel: () => null,
    children: (
      <div className="flex column">
        <p>
          You are about to enter JetGovern. New technologies have risk. Do not proceed if you do not
          understand and accept the terms and potential for financial loss.
        </p>
        <p>
          <Checkbox
            id="terms-privacy-check"
            className="terms-privacy-check"
            onChange={e => setDisclaimerChecked(e.target.checked)}
          />
          <label htmlFor="terms-privacy-check" className="terms-privacy-legend">
            I understand the{" "}
            <a
              href="https://jet-association.gitbook.io/jet-association-1.0.0/terms-of-service"
              target="_blank"
              className="link-btn"
              rel="noopener noreferrer"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="https://jet-association.gitbook.io/jet-association-1.0.0/privacy-policy"
              target="_blank"
              className="link-btn"
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>
            . I am aware of and accept the risks of using new technology.
          </label>
        </p>
      </div>
    ),
    closable: false
  };
  steps[Steps.AccessGranted1] = {
    title: REWARDS_ENABLED
      ? LABELS.ACCESS_GRANTED_1_TITLE_WITH_REWARDS
      : LABELS.ACCESS_GRANTED_1_TITLE_NO_REWARDS,
    okText: "Okay",
    onOk: () => setCurrent(Steps.AccessGranted2),
    okButtonProps: { loading: false },
    onCancel: () => handleAccessGranted(),
    cancelButtonProps: { style: { display: "none " } },
    children: (
      <div className="flex column">
        <p>
          Your wallet has been verified and you now have full access to the JetGovern module. You
          will not need to verify again.
        </p>
        <p>
          {REWARDS_ENABLED
            ? LABELS.ACCESS_GRANTED_1_PARAGRAPH_WITH_REWARDS
            : LABELS.ACCESS_GRANTED_1_PARAGRAPH_NO_REWARDS}
        </p>
      </div>
    ),
    closable: true
  };
  steps[Steps.AccessGranted2] = {
    title: "Unstaking from the module",
    okText: "Okay",
    onOk: () => handleAccessGranted(),
    okButtonProps: { loading: false },
    onCancel: () => handleAccessGranted(),
    cancelButtonProps: { style: { display: "none " } },
    children: (
      <div className="flex column">
        <p>When unstaking from JetGovern, your tokens enter a 29.5-day unbonding period.</p>
        {REWARDS_ENABLED && <p>During the unbonding period, you will not earn any rewards.</p>}
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
  steps[Steps.OriginRestricted] = {
    title: "Origin restricted",
    okText: "Okay",
    okButtonProps: undefined,
    cancelButtonProps: { style: { display: "none " } },
    onOk: () => setCurrent(Steps.ConfirmLocation),
    onCancel: () => handleDisconnect(),
    children: (
      <div className="flex column">
        <p>
          The IP address from which you are attempting to access JetGovern has been detected as a
          threat or as coming from an anonymized source.
        </p>
        <p>
          If you believe that you are receiving this message in error, you may be using a VPN.
          Please turn off your VPN and try again to verify your wallet.
        </p>
      </div>
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
          It looks like you may be trying to access JetGovern from <b>{country}</b>.
        </p>
        <p>
          Due to regulatory restrictions, JetGovern is not available to residents of certain
          countries. For more info, see the{"  "}
          <a
            href="https://jet-association.gitbook.io/jet-association-1.0.0/terms-of-service"
            target="_blank"
            className="link-btn"
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
  steps[Steps.LocationUndetected] = {
    title: "Unable to detect location",
    cancelText: "Disconnect",
    okButtonProps: { style: { display: "none " } },
    onOk: () => handleDisconnect(),
    onCancel: () => handleDisconnect(),
    children: (
      <div className="flex column">
        <p>We aren't able to detect your location.</p>
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
