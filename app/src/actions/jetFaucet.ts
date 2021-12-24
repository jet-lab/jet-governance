import { RpcContext } from "../models/core/api";
import { notify } from "../utils";
import { JET_FAUCET_DEVNET, JET_TOKEN_MINT } from "../utils/ids";
import { makeAirdropTx } from "@jet-lab/jet-engine"
import { sendTransactionWithNotifications } from '../tools/transactions';


export const jetFaucet = async (
  { connection, wallet }: RpcContext
) => {
  if (!wallet.publicKey) {
    notify({
      message: "Connect your wallet",
      description: `Please connect your wallet to receive an airdrop.`,
      type: "info",
      placement: "bottomRight",
    })
    return;
  }
  let transactionInstruction = await makeAirdropTx(
    JET_TOKEN_MINT,
    JET_FAUCET_DEVNET,
    wallet.publicKey,
    connection
  );
  await sendTransactionWithNotifications(
    connection,
    wallet,
    transactionInstruction,
    [],
    "Requesting Devnet JET airdrop.",
    "Devnet JET airdrop received.");
};