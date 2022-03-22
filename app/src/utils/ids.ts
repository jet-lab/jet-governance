import { PublicKey } from "@solana/web3.js";

export let JET_TOKEN_MINT = new PublicKey("JET6zMJWkCN9tpRT2v2jfAmm5VnQFDpUBCyaKojmGtz");
export const JET_FAUCET_DEVNET = new PublicKey("4RqY4p1xXMcMF1xrGYtJG8aaQDR7s8GHkjfSHFqcBmQV");
export const COUNCIL_TOKEN_MINT = new PublicKey("GBZ2J49hpCLM8HDFav7gQ2zJNC3LCV264y42WhoqdEYo");
export const COUNCIL_FAUCET_DEVNET = new PublicKey("3AJLr1kbsC8btrizbYTWPCvfTfCJpK7JYHHpmZdy7sgM");
export let JET_REALM = new PublicKey("ELPZU7TAy4es2x5V8SF9n4dnXZBuXaXQ6VhaiamoswAo");
export let JET_GOVERNANCE = new PublicKey("898rmGCQwSFoHXxxeSvdwKTd3kBVWcZLWbcxfWPHV72L");
export const GOVERNANCE_PROGRAM_ID = new PublicKey("JPGovTiAUgyqirerBbXXmfyt3SkHVEcpSAPjRCCSHVx");
export let BPF_UPGRADE_LOADER_ID = new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111");

export const setProgramIds = (envName: string) => {
  if (envName === "mainnet-beta") {
    JET_REALM = PublicKey.default; // FIXME!
    JET_GOVERNANCE = PublicKey.default; // FIXME!
    JET_TOKEN_MINT = new PublicKey("JET6zMJWkCN9tpRT2v2jfAmm5VnQFDpUBCyaKojmGtz");
  } else if (envName === "devnet") {
    JET_REALM = new PublicKey("ELPZU7TAy4es2x5V8SF9n4dnXZBuXaXQ6VhaiamoswAo");
    JET_GOVERNANCE = new PublicKey("898rmGCQwSFoHXxxeSvdwKTd3kBVWcZLWbcxfWPHV72L");
    JET_TOKEN_MINT = new PublicKey("FRuFWBrp1Kh6LpAi9CRvjk97C6YpCR7AERq62N2CZFUg");
  }
};
