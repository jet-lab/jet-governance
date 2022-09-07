export function TermsPrivacy(): JSX.Element {
  return (
    <div className="terms-privacy only-show-desktop flex-centered">
      <a
        href="https://docs.jetdao.fi/legal/terms-of-service"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="text-btn">Terms of Service</span>
      </a>
      <a
        href="https://docs.jetdao.fi/legal/privacy-policy"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="text-btn">Privacy Policy</span>
      </a>
      <a
        href="https://docs.jetdao.fi/getting-started/terms-and-definitions"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="text-btn">Glossary</span>
      </a>
      <a
        href="https://github.com/jet-lab/jet-governance/tree/master/reports"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="text-btn">Audit Report</span>
      </a>
    </div>
  );
}
