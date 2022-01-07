import { useEffect, useMemo, useState } from 'react'
import { useWallet } from "@solana/wallet-adapter-react";
import { Provider /*, Idl*/ } from '@project-serum/anchor';
import { GovClient, GovProposal, GovVoter, GovVoteRecord, /*makeAirdropTx*/ } from "@jet-lab/jet-engine";
import { useUserBalance } from "./useUserBalance"
import { JET_TOKEN_MINT } from "../utils/ids";
import { PublicKey } from "@solana/web3.js";
import { ConfirmOptions } from '@solana/web3.js';
import { useConnection, useMint } from '../contexts';
import { formatMintNaturalAmountAsDecimal } from '../tools/units';

/* TODO: Tristyn integration client */
export const useUser = (walletAddress?: PublicKey) => {
  const jetBalance = useUserBalance(JET_TOKEN_MINT);

  // const councilMint = useMint(councilTokenOwnerRecord?.info.governingTokenMint);
  // const mint = useMint(JET_TOKEN_MINT);

  const votingBalance = 10000;
  const stakedBalance = 71358;

  // const balance = formatMintNaturalAmountAsDecimal(
  //   councilMint,
  //   tokenOwnerRecord.info.governingTokenDepositAmount,
  // )

  return { jetBalance, votingBalance, stakedBalance };
};

// TODO: double check to load the following accounts:
// 1. user wallet
// 2. Provider
// 3. GovClient
// 4. GovRealm
// 5. GovProposal
// 6. GovVoter
// 7. GovVoteRecord

// export let idl: any;
// const idlEnv = process.env.IDL;
// if (idlEnv === 'localnet') {
//   idl = localnetIdl;
// } else if (idlEnv === 'devnet') {
//   idl = devnetIdl;
// } else if (idlEnv === 'mainnet-beta') {
//   idl = mainnetBetaIdl;
// }

const confirmOptions = {
  skipPreflight: false,
  commitment: 'recent',
  preflightCommitment: 'recent'
} as ConfirmOptions

export function useConfirmOptions() {
  return confirmOptions
}

export function useWalletAddress() {
  const wallet = useWallet();
  return wallet.publicKey;
}

export function useProvider() {
  const connection = useConnection()
  const wallet = useWallet()
  const confirmOptions = useConfirmOptions()

  return useMemo(
    () => new Provider(connection, wallet as any, confirmOptions),
    [connection, wallet, confirmOptions]
  )
}

export function useClient() {
  const provider = useProvider()
  const [client, setClient] = useState<GovClient | undefined>()

  useEffect(() => {
    let abort = false
    GovClient.connect(provider)
      // TODO: questions - what is newClient type, Idl?
      .then(newClient => !abort && setClient(newClient))
      .catch(console.error)

    return () => { abort = true }
  }, [provider])

  return client
}

// export function useRealm() {
//   const client = useClient()
//   const [realm, setRealm] = useState<GovRealm | undefined>()
//   useEffect(() => {
//     let abort = false
//     if (client) {
//       GovRealm.load(client, GOV_REALM_ADDRESS)
//         // TODO: questions - what is newRealm type, GovRealmData?
//         .then(newRealm => !abort && setRealm(newRealm))
//         .catch(console.error)
//     }

//     return () => { abort = true }
//   }, [client])

//   return realm
// }

export function useProposal() {
  const client = useClient();
  const walletAddress = useWalletAddress();
  const [proposal, setProposal] = useState<GovProposal>()
  useEffect(() => {
    let abort = false;
    if (client && walletAddress) {
      GovProposal.load(client, walletAddress)
        // TODO: questions - what is newProposal type, GovProposalData?
        .then(newProposal => !abort && setProposal(newProposal));
    }
    return () => { abort = true; }
  }, [client, walletAddress])
  return proposal;
}

export function useVoter() {
  const client = useClient()
  const walletAddress = useWalletAddress()
  const [voter, setVoter] = useState<GovVoter | undefined>()

  useEffect(() => {
    let abort = false
    if (client && walletAddress) {
      GovVoter.load(client, walletAddress)
        // TODO: questions - what is newVoter type, GovVoterData?
        .then(newVoter => !abort && setVoter(newVoter))
        .catch(console.error)
    }

    return () => { abort = true }
  }, [client, walletAddress])

  return voter
}

export function useVoteRecord() {
  const client = useClient();
  const walletAddress = useWalletAddress();
  const [voteRecord, setVoteRecord] = useState<GovVoteRecord | undefined>();
  useEffect(() => {
    let abort = false;
    if (client && walletAddress) {
      GovVoteRecord.load(client, walletAddress)
        // TODO: questions - what is newVoteRecord type, GovVoteRecordData?
        .then(newVoteRecord => !abort && setVoteRecord(newVoteRecord))
      return () => { abort = true }
    }
  }, [client, walletAddress])
  return voteRecord;
}
