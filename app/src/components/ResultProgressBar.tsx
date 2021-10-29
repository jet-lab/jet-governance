import React, { useState } from "react";

export const ResultProgressBar = (props: any) => {
  const { type, amount, total } = props;
  const [color, setColor] = useState("hsla(0, 1%, 62%, 1)")
  const [vote, setVote] = useState("abstain")

  if (type === "inFavor") {
    setVote("in favor")
    setColor("var(--gradient)")
  } else if (type === "against") {
    setVote("against")
    setColor("var(--rejected)")
  }

  return (
    <div style={{color: color}}>
      {(amount / total * 100)}% {vote.toUpperCase} <span>{amount} JET</span>
      
    </div>
  );
};
