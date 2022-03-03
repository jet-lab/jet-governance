import { RpcContext } from '@solana/spl-governance';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { useConnection, useConnectionConfig } from '../contexts';

import { useProgramInfo } from '../contexts/GovernanceContext';

export function useRpcContext() {
  const { endpoint } = useConnectionConfig();
  const connection = useConnection();
  const wallet = useWallet();
  const { programId, programVersion } = useProgramInfo();

  const [rpcContext, setRpcContext] = useState(
    new RpcContext(new PublicKey(programId), programVersion, wallet as any, connection, endpoint)
  );

  useEffect(
    () => {
      setRpcContext(
        new RpcContext(
          new PublicKey(programId),
          programVersion,
          wallet as any,
          connection,
          endpoint
        )
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [programId, connection, wallet, endpoint, programVersion]
  );

  return rpcContext;
}
