import { PublicKey } from '@solana/web3.js';
import React from 'react';
import { TokenIcon } from '..';


export function RealmBadge({
  communityMint,
  councilMint,
  size = 40,
}: {
  communityMint: PublicKey | undefined;
  councilMint?: PublicKey;
  size?: number;
}) {
  return (
    <div style={{ position: 'relative' }}>
      <TokenIcon mintAddress={communityMint} size={size} />
      {councilMint && (
        <div className="council-token-icon">
          <TokenIcon
            style={{
              position: 'absolute',
              top: 0.5 * size,
              left: 0.75 * size,
            }}
            mintAddress={councilMint}
            size={0.5 * size}
          />
        </div>
      )}
    </div>
  );
}
