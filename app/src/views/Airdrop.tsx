import { bnToNumber } from "@jet-lab/jet-engine";
import { useWallet } from "@solana/wallet-adapter-react";
import { Divider } from "antd";
import { Available, DocsLink } from "../components";
import { useProposalContext } from "../contexts";

export const AirdropView = () => {
  const { connected, publicKey } = useWallet();
  const { airdropsByWallet } = useProposalContext();

  const availAirdropsRender = airdropsByWallet?.map(airdrop => ({
    airdrop,
    finalized: !airdrop.targetInfo.finalized.isZero(),
    airdropAddress: airdrop.airdropAddress,
    shortDesc: String.fromCharCode(...airdrop.airdrop.shortDesc),
    longDesc: String.fromCharCode(...airdrop.airdrop.longDesc),
    expireAt: bnToNumber(airdrop.airdrop.expireAt),
    amount: bnToNumber(
      airdrop.targetInfo.recipients.find(
        ({ recipient }) => recipient.toString() === publicKey?.toString()
      )?.amount
    )
  }));

  return (
    <section className="view justify-start">
      <div className="neu-container flex justify-center align-start column" id="airdrop">
        <h1>Claim your airdrop!</h1>
        <Divider />
        <p>
          Available airdrops for the connected wallet are listed below. All airdrops must be claimed
          by the receiver within 90 days. After 90 days, any unclaimed claims will be redirected to
          the Jet DAO treasury for future allocation.
        </p>
        <p>
          All airdrops will be autostaked in the governance module immediately after claiming, and
          will begin earning yield immediately. Staked tokens are subject to a 29.5-day unbonding
          period.
        </p>
        <p>
          In addition to the{" "}
          <u>
            <a
              href="https://medium.com/jetprotocol/jet-staking-and-the-jetdrop-two-more-steps-towards-jet-governance-84d8de26be4a"
              target="_blank"
              rel="noreferrer"
              className="link-btn"
            >
              blog announcement
            </a>
          </u>{" "}
          on airdrop and staking details, more details can be found in the{" "}
          <u>
            <DocsLink>docs</DocsLink>
          </u>{" "}
          and{" "}
          <u>
            <a
              href="https://jet-association.gitbook.io/jet-association-1.0.0/terms-and-definitions"
              target="_blank"
              rel="noreferrer"
              className="link-btn"
            >
              glossary
            </a>
          </u>
          .
        </p>
        <Divider />
        {connected &&
          availAirdropsRender?.map(airdrop => (
            <Available airdropInfo={airdrop} key={airdrop.airdropAddress.toString()} />
          ))}
      </div>
    </section>
  );
};
