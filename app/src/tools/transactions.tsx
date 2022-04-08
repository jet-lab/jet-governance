import { TransactionInstruction, Connection, Transaction, Keypair } from "@solana/web3.js";
import { sendTransaction2 } from "./sdk/core/connection";
import {
  isTransactionTimeoutError,
  isSendTransactionError,
  isSignTransactionError,
  shortenAddress
} from "../utils";
import { Provider } from "@project-serum/anchor";
import { SendTxRequest } from "@project-serum/anchor/dist/cjs/provider";
import { WalletSigner } from "@solana/spl-governance";
import { notification } from "antd";
import { PublicKey } from "@solana/web3.js";

/**
 * For sending a single transaction
 * @param connection
 * @param wallet
 * @param instructions
 * @param signers
 * @param successMessage
 * @param explorerUrlMaker
 */
export async function sendTransactionWithNotifications(
  connection: Connection,
  wallet: WalletSigner,
  instructions: TransactionInstruction[],
  signers: Keypair[],
  successMessage: string,
  explorerUrlMaker: Function
) {
  try {
    const transaction = new Transaction();
    transaction.add(...instructions);

    const txnSignature = await sendTransaction2({
      transaction,
      wallet,
      signers,
      connection
    });

    notifyTransactionSuccess(successMessage, txnSignature, explorerUrlMaker);
  } catch (err) {
    notifyTransactionError(err);
    console.error(err);
    throw err;
  }
}

//
/**
 * For sending multiple transactions
 * @param provider
 * @param transactions
 * @param successMessage
 * @param explorerUrlMaker
 */
export async function sendAllTransactionsWithNotifications(
  provider: Provider,
  transactions: SendTxRequest[],
  successMessage: string,
  explorerUrlMaker: Function
) {
  try {
    const txnResult = await provider.sendAll(transactions);
    const txnSignature = txnResult[txnResult.length - 1];
    notifyTransactionSuccess(successMessage, txnSignature, explorerUrlMaker);
  } catch (err) {
    notifyTransactionError(err);
    console.error(err);
    throw err;
  }
}

/**
 *
 * @param successMessage
 * @param txnSignature
 * @param explorerUrlMaker
 */
export function notifyTransactionSuccess(
  successMessage: string,
  txnSignature: string | PublicKey,
  explorerUrlMaker: Function
) {
  const explorerUrl = explorerUrlMaker(txnSignature);

  notification.success({
    message: `${successMessage} Successful!`,
    description: (
      <div id="txnSuccess-modal">
        <div style={{ textDecoration: "underline" }}>
          <a href={explorerUrl} target="_blank"></a>
          {shortenAddress(txnSignature, 8)} <i className="fas fa-external-link-alt"></i>
        </div>
      </div>
    ),
    placement: "bottomLeft",
    onClick: () => {
      window.open(explorerUrl, "_blank");
    }
  });
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
