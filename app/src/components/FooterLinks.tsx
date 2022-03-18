import { useState } from "react";
import { DocsLink } from "./docsLink";
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
        <DocsLink>Docs</DocsLink>
      </span>
      <span onClick={toggleGlossaryModal}>Glossary</span>

      {showGlossaryModal && <GlossaryModal onClose={() => setShowGlossaryModal(false)} />}
      {showTermsConditionsModal && (
        <TermsConditionsModal onClose={() => setShowTermsConditionsModal(false)} />
      )}
    </div>
  );
};
