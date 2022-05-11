import { bnToNumber, StakePool } from "@jet-lab/jet-engine";
import { Mint } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { SelectProps } from "antd";
import BN from "bn.js";
import { useCallback, useState } from "react";
import { geoBannedCountries } from "../models/GEOBANNED_COUNTRIES";

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

export function fromLamports(amount: number | BN | undefined, mint: Mint | undefined): number {
  if (!amount || !mint) {
    return 0;
  }
  const fromAmount = typeof amount === "number" ? new BN(amount) : amount;
  return bnToNumber(fromAmount) / 10 ** mint.decimals;
}

export const toTokens = (amount?: BN | number, mint?: Mint) => {
  const fromAmount = typeof amount === "number" ? new BN(amount) : amount;
  const hasNoValue = fromAmount === new BN(0) || amount === 0;
  if (hasNoValue) {
    return "0";
  }
  return fromLamports(fromAmount, mint).toLocaleString(undefined, {
    maximumFractionDigits: 1
  });
};

export const withPrecisionNumber = (amount: number, precision: number = 1): number => {
  if (amount === 0) {
    return 0;
  }
  const factor = Math.pow(10, precision);
  return Math.floor(amount * factor) / factor;
};

export const toTokensPrecisionNumber = (amount: BN, mint: Mint, precision: number = 1): number => {
  if (amount === new BN(0)) {
    return 0;
  }
  return withPrecisionNumber(fromLamports(amount, mint), precision);
};

export const isMaxAvailable = (avail: number, input: number): boolean => {
  return Math.abs(avail - input) < 0.1;
};

var SI_SYMBOL = ["", "k", "M", "G", "T", "P", "E"];

export const abbreviateNumber = (number: number) => {
  let tier = (Math.log10(number) / 3) | 0;
  let scaled = number;
  let suffix = SI_SYMBOL[tier];
  if (tier !== 0) {
    let scale = Math.pow(10, tier * 3);
    scaled = number / scale;
  }

  return number < 100000
    ? new Intl.NumberFormat().format(Number(number.toFixed(2)))
    : scaled.toFixed(2) + suffix;
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
  if (endTime <= currentTime) return `${dateFromUnixTimestamp(new BN(endTime / 1000))}`;
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
    return `${hours !== 0 ? `${hours.toLocaleString()}h` : ""} ${
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

export const sharesToTokens = (
  shares: BN | number | undefined,
  stakePool: StakePool | undefined
): { tokens: BN; conversion: BN } => {
  let tokens = new BN(0);
  let conversion = new BN(0);
  if (
    !stakePool ||
    stakePool.stakePool.bonded.shares.eq(new BN(0)) ||
    stakePool.stakePool.bonded.tokens.eq(new BN(0))
  ) {
    return { tokens, conversion };
  }
  conversion = stakePool.stakePool.bonded.shares.div(stakePool.stakePool.bonded.tokens);
  if (!shares) {
    return { tokens, conversion };
  }

  const shareAmount = typeof shares === "number" ? new BN(shares) : shares;

  tokens = shareAmount
    .mul(stakePool.stakePool.bonded.tokens)
    .div(stakePool.stakePool.bonded.shares);
  return { tokens, conversion };
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
