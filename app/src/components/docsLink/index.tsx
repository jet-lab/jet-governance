export const DocsLink = ({
  children,
  className,
  noGradient
}: {
  children: any;
  className?: any;
  noGradient?: boolean;
}) => {
  const classNames = noGradient ? className : "link-btn" + className;
  return (
    <a
      href="https://docs.jetprotocol.io/jet-protocol/protocol/jet-staking"
      target="_blank"
      rel="noreferrer"
      className={classNames}
    >
      {children}
    </a>
  );
};
