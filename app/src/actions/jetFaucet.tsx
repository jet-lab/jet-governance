import { TokenFaucet } from "@jet-lab/jet-engine";
import { AnchorProvider } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { notification } from "antd";

export const jetFaucet = async (
  provider: AnchorProvider,
  faucet: PublicKey,
  mint: PublicKey,
  tokenDesc: string
) => {
  if (!provider.wallet.publicKey) {
    notification.warning({
      message: "Connect your wallet",
      description: `Please connect your wallet to receive an airdrop.`,
      placement: "bottomLeft"
    });
    return;
  }
  await TokenFaucet.airdropToken(provider, faucet, provider.wallet.publicKey, mint);
  notification.success({
    message: `Success!`,
    description: `${tokenDesc} airdrop received.`,
    placement: "bottomLeft"
  });
};
