import { useState } from "react";
import { DocsLink } from "./docsLink";
import { GlossaryModal } from "./modals/GlossaryModal";
import { TermsConditionsModal } from "./modals/TermsConditionsModal";
import { Typography } from "antd";
import "./FooterLinks.less";

export const FooterLinks = () => {
  const [showGlossaryModal, setShowGlossaryModal] = useState(false);
  const [showTermsConditionsModal, setShowTermsConditionsModal] = useState(false);

  const toggleGlossaryModal = () => {
    setShowGlossaryModal(!showGlossaryModal);
  };

  const toggleTermsConditionsModal = () => {
    setShowTermsConditionsModal(!showTermsConditionsModal);
  };
  const { Paragraph, Text } = Typography;
  return (
    <footer>
      <Typography>
        <Paragraph>
          <Text className="footer-link-item" onClick={toggleTermsConditionsModal}>
            Terms of Use
          </Text>
          <Text className="footer-link-item">
            <DocsLink>Docs</DocsLink>
          </Text>
          <Text className="footer-link-item" onClick={toggleGlossaryModal}>
            Glossary
          </Text>
          {showGlossaryModal && <GlossaryModal onClose={() => setShowGlossaryModal(false)} />}
          {showTermsConditionsModal && (
            <TermsConditionsModal onClose={() => setShowTermsConditionsModal(false)} />
          )}
        </Paragraph>
      </Typography>
    </footer>
  );
};
