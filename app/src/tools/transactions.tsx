import { Provider } from "@project-serum/anchor";
import { SendTxRequest } from "@project-serum/anchor/dist/cjs/provider";
import { WalletSigner } from "@solana/spl-governance";
import { TransactionInstruction, Connection, Transaction, Keypair, PublicKey } from "@solana/web3.js";
import { notification } from "antd";
import { sendTransaction2 } from "./sdk/core/connection";
import {
  isTransactionTimeoutError,
  isSendTransactionError,
  isSignTransactionError,
  shortenAddress
} from "../utils";

/**
 * For sending a single transaction
 * @param connection
 * @param wallet
 * @param instructions
 * @param signers
 * @returns transaction signature
 */
export async function sendTransaction(
  connection: Connection,
  wallet: WalletSigner,
  instructions: TransactionInstruction[],
  signers: Keypair[],
): Promise<string> {
  try {
    const transaction = new Transaction();
    transaction.add(...instructions);
    //return txn signature
    return await sendTransaction2({
      transaction,
      wallet,
      signers,
      connection
    });
  } catch (err) {
    notifyTransactionError(err);
    console.error(err);
    throw err;
  }
}


/**
 * For sending multiple transactions
 * @param provider
 * @param transactions
 * @returns transaction signature
 */
export async function sendAllTransactions(
  provider: Provider,
  transactions: SendTxRequest[],
): Promise<string> {
  try {
    const txnResult = await provider.sendAll(transactions);
    //return the last txn signature
    return txnResult[txnResult.length - 1];
  } catch (err) {
    notifyTransactionError(err);
    console.error(err);
    throw err;
  }
}


/**
 * Display notification modal to show successful transactions with a success message and a link to a block explorer(which one is determined in user settings)
 * @param successMessage
 * @param txnSignature
 * @param explorerUrlMaker
 */
 export function notifyTransactionSuccess(
  txnSignature: string | PublicKey,
  successMessage: string,
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

/**
 * Display transaction error modal
 * @param err
 */
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
