import { StakeAccount } from "@jet-lab/jet-engine";
import { UnbondingAccount } from "@jet-lab/jet-engine";
import { sendTransactionWithNotifications } from "../tools/transactions";
import { RpcContext } from "./../models/core/api";

export const restake = async (
  rpcContext: RpcContext,
  unbondingAccount: UnbondingAccount,
  stakeAccount: StakeAccount
) => {
  const ix = await UnbondingAccount.cancelUnbond(
    unbondingAccount,
    stakeAccount,
    rpcContext.walletPubkey
  );

  sendTransactionWithNotifications(
    rpcContext.connection,
    rpcContext.wallet,
    ix,
    [],
    "Restaking governance tokens",
    "Tokens have been staked"
  );
};
