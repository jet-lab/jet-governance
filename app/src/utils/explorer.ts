import { PublicKey } from "@solana/web3.js";

export function getExplorerUrl(viewTypeOrItemAddress: string | PublicKey, itemType: string = "tx") {
  const inDevelopment = process.env.REACT_APP_CLUSTER === "devnet";
  return `https://explorer.solana.com/${itemType}/${viewTypeOrItemAddress}${
    inDevelopment ? `?cluster=devnet` : ""
  }`;
}

export const openExplorer = (txid: string, itemType: string = "tx") =>
  window.open(`${getExplorerUrl(txid, itemType)}`, "_blank");
