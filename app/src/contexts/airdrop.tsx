import React, { useContext } from "react";

interface AirdropConfig {
  airdrops?: {
    name: string;
    amount: number;
    end: Date;
    announced: boolean;
    claimed: boolean;
    vested: boolean;
  }[],
  claimedAirdrops: Function,
  unclaimedAirdrops: Function,
  vestingAirdrops: Function,
  vestedAirdrops: Function,
  totalAirdropped: Function,
  vestingProgress: Function,
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
  vestingProgress: () => { },
  totalAirdropped: () => { },
  transactionHistory: []
});

export function AirdropProvider({ children = undefined as any }) {
  const airdrops = [
    {
      name: "Test Pilot Airdrop",
      amount: 70000,
      end: new Date("25 Jan 2022"),
      announced: true,
      claimed: true,
      vested: true,
    },
    {
      name: "But she hears only whispers of some quiet conversation",
      amount: 90000,
      end: new Date("25 Feb 2022"),
      announced: true,
      claimed: false,
      vested: true,
    },
    {
      name: "I bless the rains down in Africa",
      amount: 90000,
      end: new Date("25 Mar 2022"),
      announced: true,
      claimed: true,
      vested: false,
    },
    {
      name: "The wild dogs cry out in the night",
      amount: 90000,
      end: new Date("25 Apr 2022"),
      announced: false,
      claimed: false,
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

  const vestingProgress = () => {
    const vesting = vestingAirdrops();
    // for (let i = 0; i < vesting.length; i++) {
    //   vesting[i].end
    // }

    return 40;
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
        transactionHistory,
        vestingProgress
      }}
    >
      {children}
    </AirdropContext.Provider>
  );
}

export function useAirdrop() {
  return useContext(AirdropContext);
}
