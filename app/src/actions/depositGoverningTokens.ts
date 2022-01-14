import { PublicKey, TransactionInstruction, Account } from '@solana/web3.js';
import { withDepositGoverningTokens } from '../models/withDepositGoverningTokens';
import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '../models/core/api';
import { TokenAccount, approve } from '../models';
import { JET_TOKEN_MINT } from "../utils/ids";
import { BN } from '@project-serum/anchor';

export const depositGoverningTokens = async (
  { connection, wallet, programId, programVersion, walletPubkey }: RpcContext,
  realm: PublicKey,
  governingTokenSource: TokenAccount,
) => {
  let instructions: TransactionInstruction[] = [];
  let signers: Account[] = [];

  const amount = governingTokenSource.info.amount as BN;

  const transferAuthority = approve(
    instructions,
    [],
    governingTokenSource.pubkey,
    walletPubkey,
    amount,
  );

  signers.push(transferAuthority);

  await withDepositGoverningTokens(
    instructions,
    programId,
    programVersion,
    realm,
    governingTokenSource.pubkey,
    JET_TOKEN_MINT,
    walletPubkey,
    transferAuthority.publicKey,
    walletPubkey,
    amount,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Depositing governing tokens',
    'Tokens have been deposited',
  );
};
