// Precomputed proposal indexes, as a json?

import { PublicKey } from "@solana/web3.js";
import { GOVERNANCE_PROGRAM_SEED } from "../../models/accounts";
import { JET_TOKEN_MINT, JET_GOV_PROGRAM_ID, JET_GOVERNANCE } from "../../utils";

export const proposalIndex = async () => {
  const proposalIndexBuffer = Buffer.alloc(4);

  const proposalIndexes = [];

  for (let i = 0; i < 200; i++) {
    proposalIndexBuffer.writeInt32LE(i, 0);
  
    const [proposalAddress] = await PublicKey.findProgramAddress(
      [
        Buffer.from(GOVERNANCE_PROGRAM_SEED),
        JET_GOVERNANCE.toBuffer(), // governance pubkey
        JET_TOKEN_MINT.toBuffer(), //
        proposalIndexBuffer,
      ], JET_GOV_PROGRAM_ID,
    );

    proposalIndexes.push(proposalAddress)
  }

  return proposalIndexes
}