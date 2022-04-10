import { JetMint, StakePool } from "@jet-lab/jet-engine";
import { PublicKey } from "@solana/web3.js";
import { VoterDisplayData } from "../hooks";
import { fromLamports, sharesToTokens } from "../utils";

/** Downloads vote records in CSV format */
export const voteRecordCsvDownload = (
  itemAddress: PublicKey,
  votes: VoterDisplayData[],
  stakePool: StakePool,
  mint?: JetMint
) => {
  // define the heading for each row of the data
  var csv = "Public Key,Staked JET,Vote Weight,Vote\n";

  // merge the data with CSV
  votes?.forEach(function (vote) {
    csv += [
      vote.user,
      fromLamports(sharesToTokens(vote.voteWeight, stakePool).tokens, mint),
      fromLamports(vote.voteWeight, mint),
      vote.voteKind
    ].join(",");
    csv += "\n";
  });

  var hiddenElement = document.createElement("a");
  hiddenElement.href = "data:text/csv;charset=utf-8," + encodeURI(csv);
  hiddenElement.target = "_blank";

  //provide the name for the CSV file to be downloaded
  hiddenElement.download = `JetGovern_${itemAddress.toBase58()}_Votes.csv`;
  hiddenElement.click();
  hiddenElement.remove();
};
