import React, { useState, useEffect } from "react";
import { useMint } from "../../contexts";
import { shortenAddress, abbreviateNumber, fromLamports } from "../../utils";
import { JET_TOKEN_MINT } from "../../utils";


export const Stakeholders = (props: {
  type: string,
  amount: number,
  address: string,
  thisUser?: boolean
}) => {
  const { type, amount, address, thisUser } = props;
  const [vote, setVote] = useState("undecided")

  useEffect(() => {
    if (type === "Yea") {
    setVote("in favor")
  } else if (type === "Nay") {
    setVote("against")
  }
  }, [type])

  const mint = useMint(JET_TOKEN_MINT);

  return (
    <div className={`stakeholders ${thisUser ? 'your-vote' : ""}`} >
      <span className="voter">{thisUser && 'Your Vote'}</span>
      <span className="address">{shortenAddress(address)}</span>
      <span className="amount">{abbreviateNumber(fromLamports(amount, mint), 2)} JET</span>
      <span className="vote">{vote}</span>
    </div>
  );
};
