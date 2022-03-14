import { Divider } from "antd";
import { useWallet } from "@solana/wallet-adapter-react";
import { useProposalContext } from "../contexts/proposal";
import { useState } from "react";
import { FooterLinks } from "../components/FooterLinks";
import { GlossaryModal } from "../components/modals/GlossaryModal";
import { Available } from "../components/airdrop/Available";

export const AirdropView = () => {
  const { connected, publicKey } = useWallet();
  const { airdropsByWallet } = useProposalContext();

  const [showGlossaryModal, setShowGlossaryModal] = useState(false);

  const toggleGlossaryModal = () => {
    setShowGlossaryModal(!showGlossaryModal);
  };

  const availAirdropsRender = airdropsByWallet?.map(airdrop => ({
    airdrop,
    finalized: !airdrop.targetInfo.finalized.isZero(),
    airdropAddress: airdrop.airdropAddress,
    shortDesc: String.fromCharCode(...airdrop.airdrop.shortDesc),
    expireAt: airdrop.airdrop.expireAt.toNumber(),
    amount: airdrop.targetInfo.recipients
      .find(({ recipient }) => recipient.toString() === publicKey?.toString())
      ?.amount?.toNumber()
  }));

  return (
    <div className="view-container column-grid">
      <div className="neu-container centered" id="airdrop">
        <h1>Claim your airdrop!</h1>
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
          In addition to the
          <u>
            <a href="https://medium.com/jetprotocol/jet-staking-and-the-jetdrop-two-more-steps-towards-jet-governance-84d8de26be4a">
              blog announcement
            </a>
          </u>
          on airdrop and staking details, more details can be found in the
          <u>
            <a href="https://docs.jetprotocol.io/jet-protocol/protocol/jet-staking">docs</a>
          </u>
          and
          <span
            onClick={toggleGlossaryModal}
            style={{ textDecoration: "underline", cursor: "pointer" }}
          >
            glossary
            <GlossaryModal
              visible={showGlossaryModal}
              onClose={() => setShowGlossaryModal(false)}
            />
          </span>
        </p>
        <Divider />

        {connected &&
          availAirdropsRender?.map(airdrop => (
            <Available airdropInfo={airdrop} key={airdrop.airdropAddress.toString()} />
          ))}
      </div>
      {/* todo - styling */}
      <FooterLinks />
    </div>
  );
};
