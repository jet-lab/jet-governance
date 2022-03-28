// Copied from Explorer code https://github.com/solana-labs/solana/blob/master/explorer/src/validators/accounts/upgradeable-program.ts

import { PublicKey } from "@solana/web3.js";

import { type, number, nullable, Infer, coerce, instance, string } from "superstruct";

const PublicKeyFromString = coerce(instance(PublicKey), string(), value => new PublicKey(value));

export type ProgramDataAccountInfo = Infer<typeof ProgramDataAccountInfo>;
// eslint-disable-next-line @typescript-eslint/no-redeclare
export const ProgramDataAccountInfo = type({
  authority: nullable(PublicKeyFromString),
  // don't care about data yet
  slot: number()
});
