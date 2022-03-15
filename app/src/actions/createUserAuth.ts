import { Auth } from "@jet-lab/jet-engine";
import { Program } from "@project-serum/anchor";
import { RpcContext } from "@solana/spl-governance";
import { PublicKey } from "@solana/web3.js";
import { sendTransaction2 } from "../tools/sdk/core/connection";

export async function createUserAuth(
  { connection, wallet }: RpcContext,
  authProgram: Program,
  user: PublicKey,
  payer: PublicKey
) {
  const transaction = await Auth.createUserAuth(authProgram, user, payer);

  await sendTransaction2({
    transaction,
    wallet,
    connection,
    sendingMessage: "Creating an auth account",
    successMessage: "Auth account has been created."
  });
}
