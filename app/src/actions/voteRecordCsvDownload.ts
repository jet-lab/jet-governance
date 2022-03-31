import { JetMint } from "@jet-lab/jet-engine/lib/common";
import { PublicKey } from "@solana/web3.js";
import { VoterDisplayData } from "../hooks/proposalHooks";
import { fromLamports } from "../utils/utils";

/** Downloads vote records in CSV format */
export function voteRecordCsvDownload(
  itemAddress: PublicKey,
  votes: VoterDisplayData[],
  mint?: JetMint
) {
  // define the heading for each row of the data
  var csv = "Public Key,Vote Weight,Vote\n";

  // merge the data with CSV
  votes?.forEach(function (vote) {
    csv += [vote.user, fromLamports(vote.voteWeight, mint), vote.voteKind].join(",");
    csv += "\n";
  });

  var hiddenElement = document.createElement("a");
  hiddenElement.href = "data:text/csv;charset=utf-8," + encodeURI(csv);
  hiddenElement.target = "_blank";

  //provide the name for the CSV file to be downloaded
  hiddenElement.download = `JetGovern_${itemAddress.toBase58()}_Votes.csv`;
  hiddenElement.click();
  hiddenElement.remove();
}
