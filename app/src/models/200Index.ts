import { PublicKey } from "@solana/web3.js";
import { GOVERNANCE_PROGRAM_SEED } from "./accounts";
import { JET_TOKEN_MINT, JET_GOVERNANCE, OYSTER_GOV_PROGRAM_ID } from "../utils";

export const pubkeyIndex = async () => {

  let proposalIndexBuffer = Buffer.alloc(4);
  
  const pubkeysIndex = [];

  for (let i = 0; i < 200; i++) {
    proposalIndexBuffer.writeInt32LE(i, 0);

    const [proposalAddress] = await PublicKey.findProgramAddress(
      [
        Buffer.from(GOVERNANCE_PROGRAM_SEED),
        JET_GOVERNANCE.toBuffer(),
        JET_TOKEN_MINT.toBuffer(),
        proposalIndexBuffer,
      ],
      OYSTER_GOV_PROGRAM_ID
    );

    pubkeysIndex.push(proposalAddress.toString())
  }

  return pubkeysIndex;
}