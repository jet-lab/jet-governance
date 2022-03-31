import { useCallback, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { bnToNumber } from "@jet-lab/jet-engine";
import { geoBannedCountries } from "../models/GEOBANNED_COUNTRIES";
import { SelectProps } from "antd";
import { Mint } from "@solana/spl-token";
import { JetMint } from "@jet-lab/jet-engine/lib/common";

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

export function fromLamports(account?: number | BN, mint?: JetMint, rate: number = 1.0): number {
  if (!account || !mint) {
    return 0;
  }

  const amount = Math.floor(typeof account === "number" ? account : bnToNumber(account));

  const precision = Math.pow(10, mint.decimals || 0);
  return (amount / precision) * rate;
}

export const toTokens = (amount: BN | number | undefined, mint?: JetMint) => {
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
  if (endTime <= currentTime) return `Expired on ${dateToString(new Date(endTime))}`;
  let difference = Math.abs(endTime - currentTime) / 1000;

  const days = Math.floor(difference / 86400);
  difference -= days * 86400;

  const hours = Math.floor(difference / 3600) % 24;
  difference -= hours * 3600;

  const minutes = Math.floor(difference / 60) % 60;
  difference -= minutes * 60;

  const seconds = Math.floor(difference % 60);

  if (days > 0) {
    return `Ends in ${days} ${days === 1 ? "day" : "days"}`;
  } else {
    return `Ends in ${hours !== 0 ? `${hours.toLocaleString()}h` : ""} ${
      minutes !== 0 ? `${minutes.toLocaleString()}m` : ""
    } ${seconds.toLocaleString()}s`;
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

// --------- Country Code Info ---------
interface CountryCodeInfo {
  country: string;
  code: string;
}

const getGeoBannedCountriesArr = (geoBannedCountries: CountryCodeInfo[]) => {
  return geoBannedCountries.map(country => country.country);
};

export const geoBannedCountriesArr = getGeoBannedCountriesArr(geoBannedCountries);

const getLastNumber = (str: string) => {
  const arr = str.split(" ");
  return Number(arr[arr.length - 1]);
};

export const filterSort: SelectProps["filterSort"] = (a, b) => {
  const keyA = getLastNumber(a.key);
  const keyB = getLastNumber(b.key);
  return keyA - keyB;
};
// --------- End Country Code Info ---------
