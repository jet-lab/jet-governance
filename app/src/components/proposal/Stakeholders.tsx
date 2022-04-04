import { PublicKey } from "@solana/web3.js";
import { useState, useEffect, useMemo } from "react";
import { useProposalContext } from "../../contexts/proposal";
import { shortenAddress, abbreviateNumber, fromLamports } from "../../utils";
import { useBlockExplorer } from "../../contexts/blockExplorer";

export const Stakeholders = ({
  type,
  amount,
  user,
  thisUser
}: {
  type: string;
  amount: number;
  user: PublicKey;
  thisUser?: boolean;
}) => {
  const { getAccountExplorerUrl } = useBlockExplorer();
  const [vote, setVote] = useState("undecided");
  const address = useMemo(() => shortenAddress(user), [user]);
  const accountExplorerUrl = useMemo(() => getAccountExplorerUrl(user.toBase58()), [user]);
  const { jetMint } = useProposalContext();

  useEffect(() => {
    if (type === "Approve") {
      setVote("in favor");
    } else if (type === "Reject") {
      setVote("against");
    }
  }, [type]);
  return (
    <div className={`stakeholders ${thisUser ? "your-vote" : ""}`}>
      <span className="voter">{thisUser && "Your Vote"}</span>
      <span className="address">
        <a target="_blank" rel="noreferrer" href={accountExplorerUrl}>
          {address}
        </a>
      </span>
      <span className="amount">{abbreviateNumber(fromLamports(amount, jetMint))} JET</span>
      <span className="vote">{vote}</span>
    </div>
  );
};
