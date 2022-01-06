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
  const [gradient, setGradient] = useState(true);
  const [symbol, setSymbol] = useState("fas fa-thumbs-up");
  const divClass = useMemo(() => `results-header ${gradient ? "text-gradient" : ""}`, [gradient]);
  
  useMemo(() => {
    if (type === "nay") {
      setVote("against")
      setColor("var(--failure)")
      setSymbol("fas fa-thumbs-down")
      setGradient(false)
    } else if (type === "abstain") {
      setVote("abstain")
      setColor("var(--grey)")
      setSymbol("")
      setGradient(false)
    }
  }, [type]);

  const percent = total === 0 ? 0 : (amount / total) * 100
  const mint = useMint(JET_TOKEN_MINT);

  return (
    <div style={{ color: color }} className={divClass}>
      {percent.toFixed(0)}% {" "}
      {vote.toUpperCase()} <i className={symbol}></i>
      <span>{abbreviateNumber(fromLamports(amount, mint), 1)} JET</span>
      <Progress size="small" percent={percent} showInfo={false} strokeColor={color} />
    </div>
  );
};
