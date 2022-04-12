export const DocsLink = ({
  children,
  className,
  noGradient
}: {
  children: any;
  className?: any;
  noGradient?: boolean;
}) => {
  const classNames = noGradient ? className : "link-btn " + className;
  return (
    <a
      href="https://jet-association.gitbook.io/jet-association-1.0.0/jet-staking"
      target="_blank"
      rel="noreferrer"
      className={classNames}
    >
      {children}
    </a>
  );
};
