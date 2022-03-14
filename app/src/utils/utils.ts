import { useCallback, useState } from "react";
import { MintInfo } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { bnToNumber } from "@jet-lab/jet-engine";

export function useLocalStorageState(key: string, defaultState?: string) {
  const [state, setState] = useState(() => {
    // NOTE: Not sure if this is ok
    const storedState = localStorage.getItem(key);
    if (storedState) {
      return JSON.parse(storedState);
    }
    return defaultState;
  });

  const setLocalStorageState = useCallback(
    newState => {
      const changed = state !== newState;
      if (!changed) {
        return;
      }
      setState(newState);
      if (newState === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(newState));
      }
    },
    [state, key]
  );

  return [state, setLocalStorageState];
}

/** shorten the checksummed version of the input address to have 4 characters at start and end */
export function shortenAddress(address: PublicKey | string, chars = 4): string {
  if (address instanceof PublicKey) {
    address = address.toBase58();
  }
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function fromLamports(account?: number | BN, mint?: MintInfo, rate: number = 1.0): number {
  if (!account) {
    return 0;
  }

  const amount = Math.floor(typeof account === "number" ? account : account.toNumber());

  const precision = Math.pow(10, mint?.decimals || 0);
  return (amount / precision) * rate;
}

export const toTokens = (amount: BN | number | undefined, mint?: MintInfo) => {
  return fromLamports(amount, mint).toLocaleString(undefined, {
    maximumFractionDigits: 0
  });
};

var SI_SYMBOL = ["", "k", "M", "G", "T", "P", "E"];

export const abbreviateNumber = (number: number, precision: number) => {
  let tier = (Math.log10(number) / 3) | 0;
  let scaled = number;
  let suffix = SI_SYMBOL[tier];
  if (tier !== 0) {
    let scale = Math.pow(10, tier * 3);
    scaled = number / scale;
  }

  return scaled.toFixed(precision) + suffix;
};

export const formatUSD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

export const numberFormater = new Intl.NumberFormat("en-US", {
  style: "decimal",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export const formatPct = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Get remaining days, hours and minutes
export const getRemainingTime = (currentTime: number, endTime: number): string => {
  let difference = Math.abs(endTime - currentTime) / 1000;

  const days = Math.floor(difference / 86400);
  difference -= days * 86400;

  const hours = Math.floor(difference / 3600) % 24;
  difference -= hours * 3600;

  const minutes = Math.floor(difference / 60) % 60;
  difference -= minutes * 60;

  const seconds = Math.floor(difference % 60);

  if (days > 0) {
    return `${days} ${days === 1 ? "day" : "days"}`;
  } else {
    return `${hours.toLocaleString(undefined, {
      minimumIntegerDigits: 2
    })}:${minutes.toLocaleString(undefined, {
      minimumIntegerDigits: 2
    })}:${seconds.toLocaleString(undefined, { minimumIntegerDigits: 2 })}`;
  }
};

// Formatters for historical txns
export function dateFromUnixTimestamp(time: BN | undefined) {
  const date = new Date(bnToNumber(time) * 1000);
  const padTo2Digits = (num: number) => {
    return num.toString().padStart(2, "0");
  };
  return [date.getFullYear(), padTo2Digits(date.getMonth() + 1), padTo2Digits(date.getDate())].join(
    "-"
  );
}

export const dateToString = (date: Date) => {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];

  const day = date.getDate().toString().padStart(2, "0");
  const month = date.getMonth();
  const year = date.getFullYear();
  const localTime = date.toLocaleTimeString();
  return `${day} ${months[month]} ${year}, ${localTime}`;
};
