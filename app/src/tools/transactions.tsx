import {
  TransactionInstruction,
  Connection,
  Transaction,
  Keypair
} from '@solana/web3.js';
import { DEFAULT_TX_TIMEOUT, sendTransaction2 } from './sdk/core/connection';
import { ExplorerLink } from '../components';
import { notify, isTransactionTimeoutError, isSendTransactionError } from '../utils';
import { Provider } from '@project-serum/anchor';
import { SendTxRequest } from '@project-serum/anchor/dist/cjs/provider';
import { WalletSigner } from '@solana/spl-governance';

export async function sendTransactionWithNotifications(
  connection: Connection,
  wallet: WalletSigner,
  instructions: TransactionInstruction[],
  signers: Keypair[],
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
          message: `Transaction hasn't been confirmed within ${DEFAULT_TX_TIMEOUT / 1000
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
  provider: Provider,
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
    let txid = await provider.sendAll(transactions);

    const last = txid[txid.length - 1]
    notify({
      message: successMessage,
      type: 'success',
      description: (
        <>
          {'Transaction: '}
          <ExplorerLink
            address={last}
            type="transaction"
            short
            connection={provider.connection}
          />
        </>
      ),
    })
    console.log("Successful vote cast", last)
  } catch (txError) {
    console.error(txError);
    if (isTransactionTimeoutError(txError)) {
      notify({
        message: `Transaction hasn't been confirmed within ${DEFAULT_TX_TIMEOUT / 1000
          }s. Please check on Solana Explorer`,
        description: (
          <>
            <ExplorerLink
              address={txError.txId}
              type="transaction"
              short
              connection={provider.connection}
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
              connection={provider.connection}
            />
          </>
        ),
        type: 'error',
      });
    }
    throw txError;
  }
}