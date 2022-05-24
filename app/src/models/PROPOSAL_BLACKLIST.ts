import { PublicKey } from "@solana/web3.js";

/** Blacklist of proposals that were made by mistake */
export const PROPOSAL_BLACKLIST = [
  /** This proposal was created to bump the voting time from 5 days to 7 */
  new PublicKey("FK6BfZvje6eiuBFDWMZDvHJt4q1vEM4zKRC6si7juvvA"),
  /**
   * This proposal also was created to bump the voting time from 5 days to 7.
   * But it was mistakenly configured to vote using JET tokens when it should have been council tokens.*/
  new PublicKey("EWuoK9Pr6s64QHVvye8xST6eD3pLR3b3qpq4aLCgEB5g")
];
