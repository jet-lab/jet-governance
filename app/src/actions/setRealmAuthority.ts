import { Account, PublicKey, TransactionInstruction } from '@solana/web3.js';

import { Realm } from '../models/accounts';

import { sendTransactionWithNotifications } from '../tools/transactions';
import { RpcContext } from '../models/core/api';
import { withSetRealmAuthority } from '../models/withSetRealmAuthority';
import { ParsedAccount } from '../contexts';

export const setRealmAuthority = async (
  { connection, wallet, programId }: RpcContext,

  realm: ParsedAccount<Realm>,
  newRealmAuthority: PublicKey,
) => {
  let signers: Account[] = [];
  let instructions: TransactionInstruction[] = [];

  withSetRealmAuthority(
    instructions,
    programId,
    realm.pubkey,
    realm.info.authority!,
    newRealmAuthority,
  );

  await sendTransactionWithNotifications(
    connection,
    wallet,
    instructions,
    signers,
    'Setting realm authority',
    'Realm authority set',
  );
};
