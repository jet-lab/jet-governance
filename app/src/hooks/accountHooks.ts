import { Connection, PublicKey } from "@solana/web3.js";
import { useEffect, useState } from "react";
import { useRpcContext } from "./useRpcContext";
import {
  booleanFilter,
  getGovernanceAccount,
  getGovernanceAccounts,
  GovernanceAccount,
  MemcmpFilter,
  VoteRecord,
  ProgramAccount,
  pubkeyFilter,
  Proposal,
  Governance,
  getProposalsByGovernance,
  getVoteRecordAddress
} from "@solana/spl-governance";

export async function getUnrelinquishedVoteRecords(
  connection: Connection,
  programId: PublicKey,
  tokenOwnerRecordPk: PublicKey
) {
  return getGovernanceAccounts(connection, programId, VoteRecord, [
    pubkeyFilter(1 + 32, tokenOwnerRecordPk)!,
    booleanFilter(1 + 32 + 32, false)
  ]);
}

// Gets all proposals within a given governance
// and returns an object
export async function getParsedProposalsByGovernance(
  connection: Connection,
  programId: PublicKey,
  governance: ProgramAccount<Governance>
): Promise<{ [proposal: string]: ProgramAccount<Proposal> }> {
  const [governances] = await Promise.all([
    getGovernanceAccounts(connection, programId, Governance, [
      pubkeyFilter(1, governance.account.realm)!
    ])
  ]);

  const [proposalsByGovernance] = await Promise.all(
    governances.map(g => getProposalsByGovernance(connection, programId, governance.pubkey))
  );

  const proposals: {
    [proposal: string]: ProgramAccount<Proposal>;
  } = Object.assign(
    {},
    ...proposalsByGovernance.map(key => ({
      [key.pubkey.toString()]: key
    }))
  );

  return proposals;
}

// Fetches Governance program account using the given key and subscribes to updates
export function useGovernanceAccountByPubkey<TAccount extends GovernanceAccount>(
  accountClass: new (args: any) => TAccount,
  pubkey: PublicKey | undefined
) {
  const [account, setAccount] = useState<ProgramAccount<TAccount>>();

  const { connection } = useRpcContext();

  const getByPubkey = pubkey?.toBase58();

  useEffect(() => {
    if (!pubkey) {
      return;
    }

    getGovernanceAccount(connection, pubkey, accountClass)
      .then(loadedAccount => {
        setAccount(loadedAccount);
      })
      .catch((ex: Error) => {
        console.error(`Can't load ${pubkey.toBase58()} account`, ex);
        setAccount(undefined);
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getByPubkey, connection]);

  return account;
}

// Fetches Governance program account using the given PDA args and subscribes to updates
export function useGovernanceAccountByPda<TAccount extends GovernanceAccount>(
  accountClass: new (args: any) => TAccount,
  getPda: () => Promise<PublicKey | undefined>,
  pdaArgs: any[]
) {
  const [pda, setPda] = useState<PublicKey | undefined>();

  const pdaArgsKey = JSON.stringify(pdaArgs);

  useEffect(() => {
    let isCancelled = false;

    getPda().then(resolvedPda => {
      if (!isCancelled) {
        setPda(resolvedPda);
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => {
      isCancelled = true;
    };

    // Disable eslint warning. Adding getPda causes an infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdaArgsKey]);

  return useGovernanceAccountByPubkey<TAccount>(accountClass, pda);
}

// Fetches Governance program accounts using the given filter and subscribes to updates
export function useGovernanceAccounts<TAccount extends GovernanceAccount>(
  accountClass: new (args: any) => TAccount,
  filters?: (MemcmpFilter | undefined)[]
) {
  const [accounts, setAccounts] = useState<ProgramAccount<TAccount>[]>([]);

  const { connection, programId } = useRpcContext();

  // Use stringify to get stable dependency for useEffect to  ensure we load the initial snapshot of accounts only once
  // If it causes performance issues then we should use object compare logic https://stackoverflow.com/questions/53601931/custom-useeffect-second-argument
  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    const queryFilters = filters?.map(f => f!);
    getGovernanceAccounts(connection, programId, accountClass, queryFilters)
      .then(loadedAccounts => {
        setAccounts(loadedAccounts);
      })
      .catch((ex: Error) => {
        console.error(`Can't load ${accountClass.name}`, ex);
        setAccounts([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountClass, connection, filterKey, programId]);

  return Object.values(accounts);
}

export function useGovernanceAccountByFilter<TAccount extends GovernanceAccount>(
  accountClass: new (args: any) => TAccount,
  filters: (MemcmpFilter | undefined)[]
) {
  const accounts = useGovernanceAccounts<TAccount>(accountClass, filters);

  if (accounts.length === 0) {
    return undefined;
  }

  if (accounts.length === 1) {
    return accounts[0];
  }

  throw new Error(
    `Filters ${filters} returned multiple accounts ${accounts} for ${accountClass.name} while a single result was expected`
  );
}

export async function getVoteRecord(
  connection: Connection,
  programId: PublicKey,
  proposal: PublicKey,
  tokenOwnerRecord: PublicKey
) {
  const address = await getVoteRecordAddress(programId, proposal, tokenOwnerRecord);
  return await getGovernanceAccount(connection, address, VoteRecord);
}