import { bnToNumber } from "@jet-lab/jet-engine";
import { Progress } from "antd";
import { useState, useMemo } from "react";
import { useProposalContext } from "../../contexts";
import { abbreviateNumber, fromLamports, sharesToTokens } from "../../utils";

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
  const { jetMint, stakePool } = useProposalContext();

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
  // If there is an overflow in btToNumber, the app crashes.
  // It is better to not show an accurate progress bar than for the app to crash.
  // It seems only the nay votes don't get shown in this case.
  let jetTokens = 0;
  try {
    jetTokens = bnToNumber(sharesToTokens(amount, stakePool).tokens);
  } catch (error) {
    console.error(error);
  }

  return (
    <span>
      <strong>
        {percent.toFixed(0)}% {vote.toUpperCase()}
      </strong>
      <span className="amount">{abbreviateNumber(fromLamports(jetTokens, jetMint))} JET</span>
      <Progress size="small" percent={percent} showInfo={false} strokeColor={color} />
    </span>
  );
};
