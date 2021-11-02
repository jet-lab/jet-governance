import React, { useState, useEffect } from "react";
import { Progress } from 'antd';
import { abbreviateNumber } from "../utils/utils";

export const ResultProgressBar = (props: any) => {
  const { type, amount, total } = props;
  const [color, setColor] = useState("hsla(0, 1%, 62%, 1)")
  const [vote, setVote] = useState("abstain")
  const [gradient, setGradient] = useState(false);
  const [symbol, setSymbol] = useState("");

  useEffect(() => {
    if (type === "inFavor") {
    setVote("in favor")
    setColor("var(--gradient)")
    setGradient(true);
    setSymbol("fas fa-thumbs-up")
  } else if (type === "against") {
    setVote("against")
    setColor("var(--rejected)")
    setSymbol("fas fa-thumbs-down")
  }
}, [type])

  const percent = (amount / total) * 100

  return (
    <div style={{color: color}} className={`results-header ${gradient ? "text-gradient" : ""}`}>
      {percent.toFixed(0)}% {" "}
      {vote.toUpperCase()} <i className={symbol}></i>
      <span>{abbreviateNumber(amount, 1)} JET</span>
      <Progress percent={percent} status="active" showInfo={false} strokeColor={color} />
    </div>
  );
};