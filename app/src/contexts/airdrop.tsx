import React, { useContext } from "react";

interface AirdropConfig {
  airdrops?: {
    name: string;
    amount: number;
    end: Date;
    claimed: boolean;
    vested: boolean;
  }[],
  claimedAirdrops: Function,
  unclaimedAirdrops: Function,
  vestingAirdrops: Function,
  vestedAirdrops: Function,
  totalAirdropped: Function,
  transactionHistory: {
    date: string;
    transaction: string;
    amount: number
  }[]
}

const AirdropContext = React.createContext<AirdropConfig>({
  airdrops: [],
  claimedAirdrops: () => { },
  unclaimedAirdrops: () => { },
  vestingAirdrops:  () => { },
  vestedAirdrops: () => { },
  totalAirdropped: () => { },
  transactionHistory: []
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

  const claimedAirdrops = () => {
    const claimedAirdrops = airdrops.filter(airdrop => 
      airdrop.claimed === true
    )
    return claimedAirdrops
  }

  const unclaimedAirdrops = () => {
    const unclaimedAirdrops = airdrops.filter(airdrop => 
      airdrop.claimed === false
    )
    return unclaimedAirdrops?.length
  }

  const vestingAirdrops = () => {
    const vestingAirdrops = airdrops.filter(airdrop => 
      airdrop.claimed === true && airdrop.vested === false
    )
    return vestingAirdrops
  }

  const vestedAirdrops = () => {
    const vestedAirdrops = airdrops.filter(airdrop => 
      airdrop.claimed === true && airdrop.vested === true
    )
    return vestedAirdrops
  }

  const totalAirdropped = () => {
    const claimed = claimedAirdrops();
    const claimedAmount = [];
    for (let i = 0; i < claimed.length; i++) {
      claimedAmount.push(claimed[i].amount)
    }
    return claimedAmount.reduce((a,b)=>a+b)
  }

  const transactionHistory = [{
    date: new Date("25 Dec 2021").toString(),
    transaction: 'unstaked',
    amount: 3500
  }, {
    date: new Date("25 Nov 2020").toString(),
    transaction: 'unstaked',
    amount: 3500
  }, {
    date: new Date("25 Sep 2020").toString(),
    transaction: 'unstaked',
    amount: 3500
  }, {
    date: new Date("25 Dec 2020").toString(),
    transaction: 'unstaked',
    amount: 3500
  }, {
    date: new Date("25 Jul 2020").toString(),
    transaction: 'unstaked',
    amount: 3500
  }]

  return (
    <AirdropContext.Provider
      value={{
        airdrops,
        claimedAirdrops,
        unclaimedAirdrops,
        vestingAirdrops,
        vestedAirdrops,
        totalAirdropped,
        transactionHistory
      }}
    >
      {children}
    </AirdropContext.Provider>
  );
}

export function useAirdrop() {
  return useContext(AirdropContext);
}
