import React, { useContext } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { shortenAddress } from "@oyster/common";

interface AirdropConfig {
  airdrops?: {
    name: string;
    amount: number;
    end: Date;
    announced: boolean;
    claimed: boolean;
    claimDate?: Date;
    vestingPeriod: number;
    vested: boolean;
  }[],
  claimedAirdrops: Function,
  unclaimedAirdrops: Function,
  vestingAirdrops: Function,
  vestedAirdrops: Function,
  totalAirdropped: Function
  transactionHistory: {
    date: Date;
    status: string;
    transaction: string;
    amount: number
  }[];
  pendingTransactions: {
    date: Date;
    status: string;
    transaction: string;
    amount: number
  }[];
  completeTransactions: {
    date: Date;
    status: string;
    transaction: string;
    amount: number
  }[];
}

const AirdropContext = React.createContext<AirdropConfig>({
  airdrops: [],
  claimedAirdrops: () => { },
  unclaimedAirdrops: () => { },
  vestingAirdrops:  () => { },
  vestedAirdrops: () => { },
  totalAirdropped: () => { },
  transactionHistory: [],
  pendingTransactions: [],
  completeTransactions: []
});

export function AirdropProvider({ children = undefined as any }) {
  const { publicKey } = useWallet();

  const airdrops = [
    {
      name: "Test Pilot Airdrop",
      amount: 70000,
      end: new Date("25 Jan 2022"),
      announced: true,
      claimed: true,
      claimDate: new Date(),
      vestingPeriod: 0,
      vested: true,
    },
    {
      name: "But she hears only whispers of some quiet conversation",
      amount: 90000,
      end: new Date("25 Feb 2022"),
      announced: true,
      claimed: false,
      vestingPeriod: 0,
      vested: false,
    },
    {
      name: "I bless the rains down in Africa",
      amount: 90000,
      end: new Date("25 Mar 2022"),
      announced: true,
      claimed: true,
      claimDate: new Date("10 Dec 2021"),
      vestingPeriod: 30,
      vested: true,
    },
    {
      name: "The wild dogs cry out in the night",
      amount: 90000,
      end: new Date("25 Apr 2022"),
      announced: false,
      claimed: false,
      vestingPeriod: 0,
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
    date: new Date("25 Dec 2021"),
    status: "Pending",
    transaction: 'unstaked',
    amount: 3500
  }, {
    date: new Date("25 Nov 2020"),
    status: "Complete",
    transaction: 'unstaked',
    amount: 3500
  }, {
    date: new Date("25 Sep 2020"),
    status: "Complete",
    transaction: 'Staked from ?? airdrop',
    amount: 3500
  }, {
    date: new Date("25 Dec 2020"),
    status: "Complete",
    transaction: `Staked from wallet ${publicKey && shortenAddress(publicKey?.toString())}`,
    amount: 3500
  }, {
    date: new Date("25 Jul 2020"),
    status: "Pending",
    transaction: 'Account opened',
    amount: 3500
    }]
  
  const pendingTransactions = transactionHistory.filter(tx => tx.status === "Pending");
  const completeTransactions = transactionHistory.filter(tx => tx.status === "Complete");

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
        pendingTransactions,
        completeTransactions
      }}
    >
      {children}
    </AirdropContext.Provider>
  );
}

export function useAirdrop() {
  return useContext(AirdropContext);
}
