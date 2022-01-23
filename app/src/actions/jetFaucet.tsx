import { notify } from "../utils";
import { JET_FAUCET_DEVNET, JET_TOKEN_MINT } from "../utils/ids";
import { Airdrop } from "@jet-lab/jet-engine";
import { Provider } from "@project-serum/anchor";
import { ExplorerLink } from "../components";


export const jetFaucet = async (
  provider: Provider
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
    message: `Requesting Devnet JET airdrop...`,
    description: 'Please wait...',
    type: 'warn',
  });
  let txid = await Airdrop.airdropToken(
    provider,
    JET_FAUCET_DEVNET,
    provider.wallet.publicKey,
    JET_TOKEN_MINT
  );
  notify({
    message: "Devnet JET airdrop received.",
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