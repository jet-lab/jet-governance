import { Provider } from "@project-serum/anchor";
import { SendTxRequest } from "@project-serum/anchor/dist/cjs/provider";
import { WalletSigner } from "@solana/spl-governance";
import { TransactionInstruction, Connection, Transaction, Keypair } from "@solana/web3.js";
import { notification } from "antd";
import { sendTransaction2 } from "./sdk/core/connection";
import {
  isTransactionTimeoutError,
  isSendTransactionError,
  isSignTransactionError
} from "../utils";

export async function sendTransactionWithNotifications(
  connection: Connection,
  wallet: WalletSigner,
  instructions: TransactionInstruction[],
  signers: Keypair[],
  successMessage: string
) {
  try {
    const transaction = new Transaction();
    transaction.add(...instructions);

    await sendTransaction2({
      transaction,
      wallet,
      signers,
      connection
    });

    notification.success({
      message: "Success!",
      description: successMessage,
      placement: "bottomLeft"
    });
  } catch (err) {
    notifyTransactionError(err);
    console.error(err);
    throw err;
  }
}

// For sending multiple transactions
export async function sendAllTransactionsWithNotifications(
  provider: Provider,
  transactions: SendTxRequest[],
  successMessage: string
) {
  try {
    await provider.sendAll(transactions);

    notification.success({
      message: "Success!",
      description: successMessage,
      placement: "bottomLeft"
    });
  } catch (err) {
    notifyTransactionError(err);
    console.error(err);
    throw err;
  }
}

function notifyTransactionError(err: unknown) {
  if (isTransactionTimeoutError(err)) {
    notification.error({
      message: "Mayday!",
      description: "Transaction timed out.",
      placement: "bottomLeft"
    });
  } else if (isSignTransactionError(err)) {
    notification.error({
      message: "Mayday!",
      description: "Transaction cancelled.",
      placement: "bottomLeft"
    });
  } else if (isSendTransactionError(err)) {
    notification.error({
      message: "Mayday!",
      description: "Transaction failed.",
      placement: "bottomLeft"
    });
  }
}
