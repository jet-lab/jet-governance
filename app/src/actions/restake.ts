import { AssociatedToken, StakeAccount, StakePool, UnbondingAccount } from "@jet-lab/jet-engine";
import { Provider } from "@project-serum/anchor";
import { ProgramAccount, Realm, RpcContext } from "@solana/spl-governance";
import { TransactionInstruction } from "@solana/web3.js";
import { sendTransactionWithNotifications } from "../tools/transactions";

export const restake = async (
  { connection, wallet, walletPubkey }: RpcContext,
  unbondingAccount: UnbondingAccount,
  stakeAccount: StakeAccount,
  stakePool: StakePool,
  realm: ProgramAccount<Realm>
) => {
  const provider = new Provider(connection, wallet as any, Provider.defaultOptions());
  const ix: TransactionInstruction[] = [];
  await UnbondingAccount.withCancelUnbond(
    ix,
    unbondingAccount,
    stakeAccount,
    stakePool,
    walletPubkey
  );

  const voteMint = stakePool.addresses.stakeVoteMint;

  const voterTokenAccount = await AssociatedToken.withCreate(ix, provider, walletPubkey, voteMint);

  await StakeAccount.withMintVotes(
    ix,
    stakePool,
    realm,
    stakeAccount.stakeAccount.owner,
    voterTokenAccount
  );

  await AssociatedToken.withClose(ix, walletPubkey, voteMint, walletPubkey);

  await sendTransactionWithNotifications(connection, wallet, ix, [], "JET has been staked");
};
