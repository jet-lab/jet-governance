import { Auth } from "@jet-lab/jet-engine";
import { Program } from "@project-serum/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { sendTransactionWithNotifications } from "../tools/transactions";

export async function createUserAuth(authProgram: Program, wallet: WalletContextState, user: PublicKey, payer: PublicKey) {
  const transaction = await Auth.createUserAuth(authProgram, user, payer)
  await sendTransactionWithNotifications(
    authProgram.provider.connection,
    wallet,
    transaction.instructions,
    [],
    "Creating an auth account.",
    "Auth account has been created.",
  )
}