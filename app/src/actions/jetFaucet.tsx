import { notify } from "../utils";
import { JET_FAUCET_DEVNET, JET_TOKEN_MINT } from "../utils/ids";
import { TokenFaucet } from "@jet-lab/jet-engine";
import { Provider } from "@project-serum/anchor";
import { ExplorerLink } from "../components";
import { PublicKey } from "@solana/web3.js";


export const jetFaucet = async (
  provider: Provider,
  faucet: PublicKey,
  mint: PublicKey,
  tokenDesc: string,
) => {
  if (!provider.wallet.publicKey) {
    notify({
      message: "Connect your wallet",
      description: `Please connect your wallet to receive an airdrop.`,
      type: "info",
      placement: "bottomRight",
    })
    return;
  }
  notify({
    message: `Requesting ${tokenDesc} airdrop...`,
    description: 'Please wait...',
    type: 'warn',
  });
  let txid = await TokenFaucet.airdropToken(
    provider,
    faucet,
    provider.wallet.publicKey,
    mint
  );
  notify({
    message: `${tokenDesc} airdrop received. Please refresh your page to update your wallet balance.`,
    type: 'success',
    description: (
      <>
        {'Transaction: '}
        <ExplorerLink
          address={txid}
          type="transaction"
          short
          connection={provider.connection}
        />
      </>
    ),
  });
};