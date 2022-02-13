import { PublicKey } from "@solana/web3.js";
import { useState, useEffect, useMemo } from "react";
import { useMint } from "../../contexts";
import { shortenAddress, abbreviateNumber, fromLamports } from "../../utils";
import { JET_TOKEN_MINT } from "../../utils";


export const Stakeholders = ({ type, amount, user, thisUser }: {
  type: string,
  amount: number,
  user: PublicKey,
  thisUser?: boolean
}) => {
  const [vote, setVote] = useState("undecided")
  const address = useMemo(() => shortenAddress(user),[user])

  useEffect(() => {
    if (type === "Approve") {
    setVote("in favor")
  } else if (type === "Reject") {
    setVote("against")
  }
  }, [type])

  const mint = useMint(JET_TOKEN_MINT);

  return (
    <div className={`stakeholders ${thisUser ? 'your-vote' : ""}`} >
      <span className="voter">{thisUser && 'Your Vote'}</span>
      <span className="address">{address}</span>
      <span className="amount">{abbreviateNumber(fromLamports(amount, mint), 2)} JET</span>
      <span className="vote">{vote}</span>
    </div>
  );
};
