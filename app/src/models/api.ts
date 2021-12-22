import { Connection, PublicKey } from '@solana/web3.js';

import {
  getGovernanceSchemaForAccount,
  GovernanceAccountParser,
} from './serialisation';
import {
  getTokenOwnerRecordAddress,
  GovernanceAccount,
  GovernanceAccountClass,
  GovernanceAccountType,
  Realm,
  TokenOwnerRecord,
} from './accounts';

import { getBorshProgramAccounts, MemcmpFilter } from './core/api';
import { ParsedAccount } from '../contexts';

export async function getRealms(endpoint: string, programId: PublicKey) {
  return getBorshProgramAccounts<Realm>(
    programId,
    at => getGovernanceSchemaForAccount(at),
    endpoint,
    Realm,
  );
}

export async function getTokenOwnerRecordForRealm(
  connection: Connection,
  programId: PublicKey,
  realm: PublicKey,
  governingTokenMint: PublicKey,
  governingTokenOwner: PublicKey,
) {
  const tokenOwnerRecordPk = await getTokenOwnerRecordAddress(
    programId,
    realm,
    governingTokenMint,
    governingTokenOwner,
  );

  const tokenOwnerRecordInfo = await connection.getAccountInfo(
    tokenOwnerRecordPk,
  );

  if (!tokenOwnerRecordInfo) {
    throw new Error(
      `Can't fetch token owner record at ${tokenOwnerRecordPk.toBase58()}`,
    );
  }

  const tokenOwnerRecord = GovernanceAccountParser(TokenOwnerRecord)(
    tokenOwnerRecordPk,
    tokenOwnerRecordInfo,
  ) as ParsedAccount<TokenOwnerRecord>;

  return tokenOwnerRecord;
}

export async function getGovernanceAccounts<TAccount extends GovernanceAccount>(
  programId: PublicKey,
  endpoint: string,
  accountClass: GovernanceAccountClass,
  accountTypes: GovernanceAccountType[],
  filters: MemcmpFilter[] = [],
) {
  if (accountTypes.length === 1) {
    return getBorshProgramAccounts<TAccount>(
      programId,
      at => getGovernanceSchemaForAccount(at),
      endpoint,
      accountClass as any,
      filters,
      accountTypes[0],
    );
  }

  const all = await Promise.all(
    accountTypes.map(at =>
      getBorshProgramAccounts<TAccount>(
        programId,
        at => getGovernanceSchemaForAccount(at),
        endpoint,
        accountClass as any,
        filters,
        at,
      ),
    ),
  );

  return all.reduce((res, r) => ({ ...res, ...r }), {}) as Record<
    string,
    ParsedAccount<TAccount>
  >;
}
