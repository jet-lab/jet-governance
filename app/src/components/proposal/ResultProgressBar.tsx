import React, { useState, useEffect, useMemo } from "react";
import { Progress } from 'antd';
import { abbreviateNumber, JET_TOKEN_MINT, fromLamports } from "../../utils";
import { useMint } from "../../contexts";

export const ResultProgressBar = (props: {
  type: string, amount: number, total: number
}) => {
  const { type, amount, total } = props;
  const [color, setColor] = useState("")
  const [vote, setVote] = useState("in favor")
  
  useMemo(() => {
    if (type === "Reject") {
      setVote("against")
      setColor("var(--failure)")
    } else if (type === "Abstain") {
      setVote("abstain")
      setColor("var(--grey)")
    }
  }, [type]);

  const percent = total === 0 ? 0 : (amount / total) * 100
  const mint = useMint(JET_TOKEN_MINT);

  return (
    <span>
      <strong>
        {percent.toFixed(0)}% {" "}
        {vote.toUpperCase()}
      </strong>
      <span className="amount">{abbreviateNumber(fromLamports(amount, mint), 1)} JET</span>
      <Progress size="small" percent={percent} showInfo={false} strokeColor={color} />
    </span>
  );
};
