import { PublicKey } from "@solana/web3.js";

export const WRAPPED_SOL_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
);
export const JET_TOKEN_MINT = new PublicKey(
  "JET6zMJWkCN9tpRT2v2jfAmm5VnQFDpUBCyaKojmGtz"
);
export const JET_TOKEN_MINT_DEVNET = new PublicKey(
  "FRuFWBrp1Kh6LpAi9CRvjk97C6YpCR7AERq62N2CZFUg"
);
export const JET_FAUCET_DEVNET = new PublicKey(
  "4RqY4p1xXMcMF1xrGYtJG8aaQDR7s8GHkjfSHFqcBmQV"
);

export let TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);

export let LENDING_PROGRAM_ID = new PublicKey(
  "TokenLending1111111111111111111111111111111"
);

export let SWAP_PROGRAM_ID = new PublicKey(
  "SwaPpA9LAaLfeLi3a68M4DjnLqgtticKg6CnyNwgAC8"
);

export const JET_GOV_PROGRAM_ID = new PublicKey(
  "5TBwvU5xoA13fzmZgWVgFBUmBz1YCdiq2AshDZpPn3AL"
);

// TODO: what is the realm public key?
export const GOV_REALM_ADDRESS = new PublicKey(
  "Realm11111111111111111111111111111111111111"
);

export const PROGRAM_IDS = [
  {
    name: "mainnet-beta",
  },
  {
    name: "testnet",
  },
  {
    name: "devnet",
  },
  {
    name: "localnet",
  },
];

export const setProgramIds = (envName: string) => {
  let instance = PROGRAM_IDS.find((env) => env.name === envName);
  if (!instance) {
    return;
  }
};

export const programIds = () => {
  return {
    token: TOKEN_PROGRAM_ID,
  };
};
