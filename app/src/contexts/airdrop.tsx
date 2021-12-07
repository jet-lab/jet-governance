import React, { useContext } from "react";

interface AirdropConfig {
  airdrops?: {
    name: string,
    amount: number,
    end: Date,
    claimed: boolean,
    vested?: boolean
  }[];
}

const AirdropContext = React.createContext<AirdropConfig>({
  airdrops: []
});

export function AirdropProvider({ children = undefined as any }) {
  const airdrops = [{
    name: "Let it rain",
    amount: 70000,
    end: new Date(),
    claimed: true,
    vested: false
  }, {
    name: "Top secret airdrop",
    amount: 90000,
    end: new Date(),
    claimed: false
    }
  ]

  return (
    <AirdropContext.Provider
      value={{
        airdrops
      }}
    >
      {children}
    </AirdropContext.Provider>
  );
}

export function useAirdrop() {
  return useContext(AirdropContext);
}