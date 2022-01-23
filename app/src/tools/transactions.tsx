import {
  Account,
  TransactionInstruction,
  Connection,
  Transaction
} from '@solana/web3.js';
import { WalletContextState } from "@solana/wallet-adapter-react";
import { DEFAULT_TX_TIMEOUT, sendTransaction2 } from './sdk/core/connection';
import { ExplorerLink } from '../components';
import { notify, isTransactionTimeoutError, isSendTransactionError } from '../utils';
import { Provider } from '@project-serum/anchor';
import { SendTxRequest } from '@project-serum/anchor/dist/cjs/provider';

export async function sendTransactionWithNotifications(
  connection: Connection,
  wallet: WalletContextState,
  instructions: TransactionInstruction[],
  signers: Account[],
  pendingMessage: string,
  successMessage: string,
) {
  notify({
    message: `${pendingMessage}...`,
    description: 'Please wait...',
    type: 'warn',
  });

  try {
    const transaction = new Transaction();
    transaction.add(...instructions);

    try {
      let txid = await sendTransaction2({
        transaction,
        wallet,
        signers,
        connection,
      });

      notify({
        message: successMessage,
        type: 'success',
        description: (
          <>
            {'Transaction: '}
            <ExplorerLink
              address={txid}
              type="transaction"
              short
              connection={connection}
            />
          </>
        ),
      });
    } catch (txError) {
      if (isTransactionTimeoutError(txError)) {
        notify({
          message: `Transaction hasn't been confirmed within ${
            DEFAULT_TX_TIMEOUT / 1000
          }s. Please check on Solana Explorer`,
          description: (
            <>
              <ExplorerLink
                address={txError.txId}
                type="transaction"
                short
                connection={connection}
              />
            </>
          ),
          type: 'warn',
        });
      } else if (isSendTransactionError(txError)) {
        notify({
          message: 'Transaction error',
          description: (
            <>
              <ExplorerLink
                address={txError.txId}
                type="transaction"
                short
                connection={connection}
              />
            </>
          ),
          type: 'error',
        });
      }
      throw txError;
    }
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
}

// For sending multiple transactions
export async function sendAllTransactionsWithNotifications(
  connection: Connection,
  wallet: WalletContextState,
  transactions: SendTxRequest[],
  pendingMessage: string,
  successMessage: string,
) {
  notify({
    message: `${pendingMessage}...`,
    description: 'Please wait...',
    type: 'warn',
  });

  try {

  // FIXME: make oyster and anchor wallet types compatible with an adapter pattern
  // instead of using as any
    const provider = new Provider(connection, wallet as any, Provider.defaultOptions())

    try {      
      let txid = await provider.sendAll(transactions);

      txid.map(tx => notify({
        message: successMessage,
        type: 'success',
        description: (
          <>
            {'Transaction: '}
            <ExplorerLink
              address={tx}
              type="transaction"
              short
              connection={connection}
            />
          </>
        ),
      }))
      ;
    } catch (txError) {
      if (isTransactionTimeoutError(txError)) {
        notify({
          message: `Transaction hasn't been confirmed within ${
            DEFAULT_TX_TIMEOUT / 1000
          }s. Please check on Solana Explorer`,
          description: (
            <>
              <ExplorerLink
                address={txError.txId}
                type="transaction"
                short
                connection={connection}
              />
            </>
          ),
          type: 'warn',
        });
      } else if (isSendTransactionError(txError)) {
        notify({
          message: 'Transaction error',
          description: (
            <>
              <ExplorerLink
                address={txError.txId}
                type="transaction"
                short
                connection={connection}
              />
            </>
          ),
          type: 'error',
        });
      }
      throw txError;
    }
  } catch (ex) {
    console.error(ex);
    throw ex;
  }
}