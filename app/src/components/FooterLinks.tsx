import { useState } from "react";
import { GlossaryModal } from "./modals/GlossaryModal";
import { TermsConditionsModal } from "./modals/TermsConditionsModal";

export const FooterLinks = () => {
  const [showGlossaryModal, setShowGlossaryModal] = useState(false);
  const [showTermsConditionsModal, setShowTermsConditionsModal] = useState(false);

  const toggleGlossaryModal = () => {
    setShowGlossaryModal(!showGlossaryModal);
  };

  const toggleTermsConditionsModal = () => {
    setShowTermsConditionsModal(!showTermsConditionsModal);
  };

  return (
    <div className="footer-links">
      <span onClick={toggleTermsConditionsModal}>Terms of Use</span>
      <span>
        <a href="https://docs.jetprotocol.io/jet-protocol/protocol/jet-staking">Docs</a>
      </span>
      <span onClick={toggleGlossaryModal}>Glossary</span>

      <GlossaryModal visible={showGlossaryModal} onClose={() => setShowGlossaryModal(false)} />
      <TermsConditionsModal
        visible={showTermsConditionsModal}
        onClose={() => setShowTermsConditionsModal(false)}
      />
    </div>
  );
};
