import { useState, useMemo } from "react";
import { Progress } from "antd";
import { abbreviateNumber, fromLamports } from "../../utils";
import { useProposalContext } from "../../contexts/proposal";

export const ResultProgressBar = ({
  type,
  amount,
  total
}: {
  type: string;
  amount: number;
  total: number;
}) => {
  const [color, setColor] = useState("");
  const [vote, setVote] = useState("in favor");
  const { jetMint } = useProposalContext();

  useMemo(() => {
    if (type === "Reject") {
      setVote("against");
      setColor("var(--failure)");
    } else if (type === "Abstain") {
      setVote("abstain");
      setColor("var(--grey)");
    }
  }, [type]);

  const percent = total === 0 ? 0 : (amount / total) * 100;

  return (
    <span>
      <strong>
        {percent.toFixed(0)}% {vote.toUpperCase()}
      </strong>
      <span className="amount">{abbreviateNumber(fromLamports(amount, jetMint), 2)} JET</span>
      <Progress size="small" percent={percent} showInfo={false} strokeColor={color} />
    </span>
  );
};
