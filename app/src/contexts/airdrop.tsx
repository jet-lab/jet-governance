import React, { useContext } from "react";

interface AirdropConfig {
  airdrops?: {
    name: string;
    amount: number;
    end: Date;
    claimed: boolean;
    vested: boolean;
  }[],
  unclaimedAirdrops: Function,
  vestedAirdrops: Function
}

const AirdropContext = React.createContext<AirdropConfig>({
  airdrops: [],
  unclaimedAirdrops: () => { },
  vestedAirdrops: () => { }
});

export function AirdropProvider({ children = undefined as any }) {
  const airdrops = [
    {
      name: "I hear the drums echoing tonight",
      amount: 70000,
      end: new Date(),
      claimed: true,
      vested: true,
    },
    {
      name: "But she hears only whispers of some quiet conversation",
      amount: 90000,
      end: new Date(),
      claimed: false,
      vested: true,
    },
    {
      name: "I bless the rains down in Africa",
      amount: 90000,
      end: new Date(),
      claimed: true,
      vested: false,
    },
    {
      name: "The wild dogs cry out in the night",
      amount: 90000,
      end: new Date(),
      claimed: true,
      vested: false,
    },
  ];

  const unclaimedAirdrops = () => {
    const unclaimedAirdrops = airdrops.filter(airdrop => 
      airdrop.claimed === false    
    )
    return unclaimedAirdrops?.length
  }

  const vestedAirdrops = () => {
    const vestedAirdrops = airdrops.filter(airdrop => 
      airdrop.claimed === true && airdrop.vested === true
    )
    return vestedAirdrops
  }

  return (
    <AirdropContext.Provider
      value={{
        airdrops,
        unclaimedAirdrops,
        vestedAirdrops
      }}
    >
      {children}
    </AirdropContext.Provider>
  );
}

export function useAirdrop() {
  return useContext(AirdropContext);
}
