export const DocsLink = ({ children, className }: { children: any; className?: any }) => {
  return (
    <a
      href="https://docs.jetprotocol.io/jet-protocol/protocol/jet-staking"
      target="_blank"
      rel="noreferrer"
      className={className}
    >
      {children}
    </a>
  );
};
