import { PublicKey } from '@solana/web3.js';
import { TokenSwapLayout, TokenSwapLayoutV1 } from '../models/tokenSwap';

export const WRAPPED_SOL_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112"
);
export let JET_TOKEN_MINT = new PublicKey(
  "JET6zMJWkCN9tpRT2v2jfAmm5VnQFDpUBCyaKojmGtz"
);
export const JET_FAUCET_DEVNET = new PublicKey(
  "4RqY4p1xXMcMF1xrGYtJG8aaQDR7s8GHkjfSHFqcBmQV"
);
export const COUNCIL_TOKEN_MINT = new PublicKey(
  "GBZ2J49hpCLM8HDFav7gQ2zJNC3LCV264y42WhoqdEYo"
);
export const COUNCIL_FAUCET_DEVNET = new PublicKey(
  "3AJLr1kbsC8btrizbYTWPCvfTfCJpK7JYHHpmZdy7sgM"
);
export let JET_REALM = new PublicKey(
  "ASRAHYwEVhV3mGUarRvaE59ZUpKA8qKbNbLtipqT6J3G"
);
export let JET_GOVERNANCE = new PublicKey(
  "FJBrF515muB9p4zzQYh3CUgf51fKdd813BhRX4oUVryA"
);

export const GOVERNANCE_PROGRAM_ID = new PublicKey(
  "GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw"
);

export let TOKEN_PROGRAM_ID = new PublicKey(
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
);

export const LENDING_PROGRAM_ID = new PublicKey(
  'LendZqTs7gn5CTSJU1jWKhKuVpjJGom45nnwPb2AMTi',
);

export let SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
);
export let BPF_UPGRADE_LOADER_ID = new PublicKey(
  'BPFLoaderUpgradeab1e11111111111111111111111',
);
export let METADATA_PROGRAM_ID = new PublicKey(
  'metaTA73sFPqA8whreUbBsbn3SLJH2vhrW9fP5dmfdC',
);

export const MEMO_ID = new PublicKey(
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
);

export const VAULT_ID = new PublicKey(
  '94wRaYAQdC2gYF76AUTYSugNJ3rAC4EimjAMPwM7uYry',
);

export const AUCTION_ID = new PublicKey(
  'C9nHkL6BfGx9M9MyYrJqAD5hPsGJd1fHpp1uAJA6vTCn',
);

export const METAPLEX_ID = new PublicKey(
  'EPtpKdKW8qciGVd1UFyGjgbBHTbSAyvbY61h9uQGVgeu',
);

export let SYSTEM = new PublicKey('11111111111111111111111111111111');

let WORMHOLE_BRIDGE: {
  pubkey: PublicKey;
  bridge: string;
  wrappedMaster: string;
};

let SWAP_PROGRAM_ID: PublicKey;
let SWAP_PROGRAM_LEGACY_IDS: PublicKey[];
let SWAP_PROGRAM_LAYOUT: any;

export const LEND_HOST_FEE_ADDRESS = process && process.env.REACT_APP_LEND_HOST_FEE_ADDRESS
  ? new PublicKey(`${process.env.REACT_APP_LEND_HOST_FEE_ADDRESS}`)
  : undefined;

console.debug(`Lend host fee address: ${LEND_HOST_FEE_ADDRESS?.toBase58()}`);

export const ENABLE_FEES_INPUT = false;

// legacy pools are used to show users contributions in those pools to allow for withdrawals of funds
export const PROGRAM_IDS = [
  {
    name: 'mainnet-beta',

    wormhole: () => ({
      pubkey: new PublicKey('WormT3McKhFJ2RkiGpdw9GKvNCrB2aB54gb2uV9MfQC'),
      bridge: '0xf92cD566Ea4864356C5491c177A430C222d7e678',
      wrappedMaster: '9A5e27995309a03f8B583feBdE7eF289FcCdC6Ae',
    }),
    swap: () => ({
      current: {
        pubkey: new PublicKey('9qvG1zUp8xF1Bi4m6UdRNby1BAAuaDrUxSpv4CmRRMjL'),
        layout: TokenSwapLayoutV1,
      },
      legacy: [
        // TODO: uncomment to enable legacy contract
        // new PublicKey("9qvG1zUp8xF1Bi4m6UdRNby1BAAuaDrUxSpv4CmRRMjL"),
      ],
    }),
  },
  {
    name: 'testnet',

    wormhole: () => ({
      pubkey: new PublicKey('5gQf5AUhAgWYgUCt9ouShm9H7dzzXUsLdssYwe5krKhg'),
      bridge: '0x251bBCD91E84098509beaeAfF0B9951859af66D3',
      wrappedMaster: 'E39f0b145C0aF079B214c5a8840B2B01eA14794c',
    }),
    swap: () => ({
      current: {
        pubkey: new PublicKey('2n2dsFSgmPcZ8jkmBZLGUM2nzuFqcBGQ3JEEj6RJJcEg'),
        layout: TokenSwapLayoutV1,
      },
      legacy: [],
    }),
  },

  {
    name: 'devnet',

    wormhole: () => ({
      pubkey: new PublicKey('WormT3McKhFJ2RkiGpdw9GKvNCrB2aB54gb2uV9MfQC'),
      bridge: '0xf92cD566Ea4864356C5491c177A430C222d7e678',
      wrappedMaster: '9A5e27995309a03f8B583feBdE7eF289FcCdC6Ae',
    }),
    swap: () => ({
      current: {
        pubkey: new PublicKey('6Cust2JhvweKLh4CVo1dt21s2PJ86uNGkziudpkNPaCj'),
        layout: TokenSwapLayout,
      },
      legacy: [new PublicKey('BSfTAcBdqmvX5iE2PW88WFNNp2DHhLUaBKk5WrnxVkcJ')],
    }),
  },
  {
    name: 'localnet',

    wormhole: () => ({
      pubkey: new PublicKey('WormT3McKhFJ2RkiGpdw9GKvNCrB2aB54gb2uV9MfQC'),
      bridge: '0xf92cD566Ea4864356C5491c177A430C222d7e678',
      wrappedMaster: '9A5e27995309a03f8B583feBdE7eF289FcCdC6Ae',
    }),
    swap: () => ({
      current: {
        pubkey: new PublicKey('369YmCWHGxznT7GGBhcLZDRcRoGWmGKFWdmtiPy78yj7'),
        layout: TokenSwapLayoutV1,
      },
      legacy: [],
    }),
  },
];

export const setProgramIds = (envName: string) => {
  let instance = PROGRAM_IDS.find(env => envName.indexOf(env.name) >= 0);
  if (!instance) {
    return;
  }

  WORMHOLE_BRIDGE = instance.wormhole();

  let swap = instance.swap();

  SWAP_PROGRAM_ID = swap.current.pubkey;
  SWAP_PROGRAM_LAYOUT = swap.current.layout;
  SWAP_PROGRAM_LEGACY_IDS = swap.legacy;


  if (envName === 'mainnet-beta') {
    JET_REALM = PublicKey.default; // FIXME!
    JET_GOVERNANCE = PublicKey.default; // FIXME!
    JET_TOKEN_MINT = new PublicKey(
      "JET6zMJWkCN9tpRT2v2jfAmm5VnQFDpUBCyaKojmGtz"
    );
  } else if (envName === "devnet") {
    JET_REALM = new PublicKey(
      "ASRAHYwEVhV3mGUarRvaE59ZUpKA8qKbNbLtipqT6J3G"
    );
    JET_GOVERNANCE = new PublicKey(
      "FJBrF515muB9p4zzQYh3CUgf51fKdd813BhRX4oUVryA"
    );
    JET_TOKEN_MINT = new PublicKey(
      "FRuFWBrp1Kh6LpAi9CRvjk97C6YpCR7AERq62N2CZFUg"
    );
  }
};

export const programIds = () => {
  return {
    token: TOKEN_PROGRAM_ID,
    swap: SWAP_PROGRAM_ID,
    swap_legacy: SWAP_PROGRAM_LEGACY_IDS,
    swapLayout: SWAP_PROGRAM_LAYOUT,
    lending: LENDING_PROGRAM_ID,
    wormhole: WORMHOLE_BRIDGE,

    associatedToken: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    bpf_upgrade_loader: BPF_UPGRADE_LOADER_ID,
    system: SYSTEM,
    metadata: METADATA_PROGRAM_ID,
    memo: MEMO_ID,
    vault: VAULT_ID,
    auction: AUCTION_ID,
    metaplex: METAPLEX_ID,
  };
};
