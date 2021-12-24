import { PublicKey } from "@solana/web3.js";
import { VoterDisplayData } from "../hooks/proposalHooks";


/** Downloads vote records in CSV format */
export function voteRecordCsvDownload(itemAddress: PublicKey, votes: VoterDisplayData[]) {
  // define the heading for each row of the data
  var csv = "PublicKey,VoteWeight,VoteType\n";

  // merge the data with CSV
  votes.forEach(function (vote) {
    csv += [vote.title, vote.value, vote.group].join(",");
    csv += "\n";
  });

  var hiddenElement = document.createElement("a");
  hiddenElement.href = "data:text/csv;charset=utf-8," + encodeURI(csv);
  hiddenElement.target = "_blank";

  //provide the name for the CSV file to be downloaded
  hiddenElement.download = `JetGovern_${itemAddress.toBase58()}_Votes.csv'`;
  hiddenElement.click();
  hiddenElement.remove();
};