import { Auth } from "@jet-lab/jet-engine";
import { Program } from "@project-serum/anchor";
import { RpcContext } from "@solana/spl-governance";
import { PublicKey } from "@solana/web3.js";
import { sendTransactionWithNotifications } from "../tools/transactions";

export async function createUserAuth(
  { connection, wallet }: RpcContext,
  authProgram: Program,
  user: PublicKey,
  payer: PublicKey
) {
  const transaction = await Auth.createUserAuth(authProgram, user, payer);
  await sendTransactionWithNotifications(
    connection,
    wallet,
    transaction.instructions,
    [],
    "Creating an auth account.",
    "Auth account has been created."
  );
}
