export function TermsPrivacy(): JSX.Element {
  return (
    <div className="terms-privacy flex-centered">
      <a href="/" target="_blank" rel="noopener noreferrer">
        <span className="text-btn">Terms of Service</span>
      </a>
      <a
        href="https://www.jetprotocol.io/legal/privacy-policy"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="text-btn">Privacy Policy</span>
      </a>
      <a
        href="https://docs.jetprotocol.io/jet-protocol/terms-and-definitions#jetgovern-definitions"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="text-btn">Glossary</span>
      </a>
    </div>
  );
}
