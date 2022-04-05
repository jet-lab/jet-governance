import { Typography } from "antd";

export const StakedJetBalance = ({
  stakedJet,
  onClick
}: {
  stakedJet: string;
  onClick?: (e?: React.MouseEvent<HTMLDivElement, MouseEvent> | undefined) => void;
}) => {
  const { Paragraph } = Typography;
  const getFontResizeClass = (lengthChars: number) => {
    const resizeCharTypes = {
      moreThan7: "resize-font-size-more-than-7-char",
      moreThan9: "resize-font-size-more-than-9-char",
      moreThan13: "resize-font-size-more-than-13-char",
      moreThan16: "resize-font-size-more-than-16-char",
      moreThan22: "resize-font-size-more-than-22-char",
      moreThan30: "resize-font-size-more-than-30-char"
    };
    if (lengthChars > 30) {
      return resizeCharTypes.moreThan30;
    }
    if (lengthChars > 22) {
      return resizeCharTypes.moreThan22;
    }
    if (lengthChars > 16) {
      return resizeCharTypes.moreThan16;
    }
    if (lengthChars > 12) {
      return resizeCharTypes.moreThan13;
    }
    if (lengthChars > 8) {
      return resizeCharTypes.moreThan9;
    }
    if (lengthChars > 6) {
      return resizeCharTypes.moreThan7;
    }
    return "";
  };
  return (
    <Paragraph
      className={`gradient-text vote-balance info-legend-item info-legend-item-prefill ${getFontResizeClass(
        stakedJet.length
      )}`}
      onClick={onClick}
    >
      {stakedJet}
    </Paragraph>
  );
};
