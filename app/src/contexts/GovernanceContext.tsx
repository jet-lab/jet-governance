import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { useLocation } from "react-router-dom";
import { getProgramVersion, PROGRAM_VERSION } from "../models/registry/api";
import { useConnection, useConnectionConfig } from ".";
import { getRealms, ProgramAccount, Realm } from "@solana/spl-governance";
import { GOVERNANCE_PROGRAM_ID } from "../utils";

export interface GovernanceContextState {
  realms: Record<string, ProgramAccount<Realm>>;
  programId: string;
  programVersion: number;
}

export const GovernanceContext = createContext<GovernanceContextState | null>(null);

export function GovernanceProvider({ children = null as any }) {
  const connection = useConnection();
  const { env } = useConnectionConfig();
  const location = useLocation();

  const programId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("programId") ?? GOVERNANCE_PROGRAM_ID.toBase58();
  }, [location]);

  const [realms, setRealms] = useState({});
  const [programVersion, setProgramVersion] = useState(PROGRAM_VERSION);

  useEffect(() => {
    const programPk = new PublicKey(programId);
    getRealms(connection, programPk)
      .then(loadedRealms => {
        setRealms(loadedRealms);
      })
      .catch((ex: Error) => {
        console.error("Can't load Realms", ex);
        setRealms({});
      });
  }, [connection, programId]); //eslint-disable-line

  useEffect(() => {
    getProgramVersion(connection, programId, env).then(pVersion => {
      setProgramVersion(pVersion);
    });
  }, [env, connection, programId]);

  return (
    <GovernanceContext.Provider
      value={{
        realms,
        programVersion,
        programId
      }}
    >
      {children}
    </GovernanceContext.Provider>
  );
}

export function useGovernanceContext() {
  const context = useContext(GovernanceContext);
  return context as GovernanceContextState;
}

export function useProgramInfo() {
  const context = useGovernanceContext();
  return {
    programVersion: context.programVersion,
    programId: context.programId
  };
}

export function useRealms() {
  const ctx = useGovernanceContext();
  return Object.values(ctx.realms);
}

export function useRealm(realm: PublicKey | undefined) {
  const ctx = useGovernanceContext();
  return realm && ctx.realms[realm.toBase58()];
}
