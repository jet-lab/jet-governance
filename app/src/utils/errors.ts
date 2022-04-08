import { Idl } from "@project-serum/anchor";
import { TransactionError } from "@solana/web3.js";

export class SendTransactionError extends Error {
  txError: TransactionError | undefined;
  txId: string;
  constructor(message: string, txId: string, txError?: TransactionError) {
    super(message);

    this.txError = txError;
    this.txId = txId;
  }
}

export function isSendTransactionError(error: any): error is SendTransactionError {
  return error instanceof SendTransactionError;
}

export class SignTransactionError extends Error {}

export function isSignTransactionError(error: any): error is SignTransactionError {
  return error instanceof SignTransactionError;
}

export class TransactionTimeoutError extends Error {
  txId: string;
  constructor(txId: string) {
    super(`Transaction has timed out`);

    this.txId = txId;
  }
}

export function isTransactionTimeoutError(error: any): error is TransactionTimeoutError {
  return error instanceof TransactionTimeoutError;
}

/**
 * Transaction errors contain extra goodies like a message and error code. Log them
 * @param error An error object from anchor.
 * @returns A stringified error.
 */
export const transactionErrorToString = (error: any, idl: Idl) => {
  if (error.code) {
    return `Code ${error.code}: ${error.msg}\n${error.logs}\n${error.stack}`;
  } else {
    return `${error} ${getErrNameAndMsg(
      Number(getCustomProgramErrorCode(JSON.stringify(error))[1]),
      idl
    )}`;
  }
};

//Take error code and and return error explanation
export const getErrNameAndMsg = (errCode: number, idl: Idl): string => {
  const errors = idl.errors ?? [];
  const code = Number(errCode);

  if (code >= 100 && code < 300) {
    return `This is an Anchor program error code ${code}. Please check here: https://github.com/project-serum/anchor/blob/master/lang/src/error.rs`;
  }

  for (let i = 0; i < errors.length; i++) {
    const err = errors[i];
    if (err.code === code) {
      return `\n\nCustom Program Error Code: ${errCode} \n- ${err.name}`;
    }
  }
  return `No matching error code description or translation for ${errCode}`;
};

//get the custom program error code if there's any in the error message and return parsed error code hex to number string

/**
 * Get the custom program error code if there's any in the error message and return parsed error code hex to number string
 * @param errMessage string - error message that would contain the word "custom program error:" if it's a customer program error
 * @returns [boolean, string] - probably not a custom program error if false otherwise the second element will be the code number in string
 */
export const getCustomProgramErrorCode = (errMessage: string): [boolean, string] => {
  const index = errMessage.indexOf("custom program error:");
  if (index === -1) {
    return [false, "May not be a custom program error"];
  } else {
    return [true, `${parseInt(errMessage.substring(index + 22, index + 28).replace(" ", ""), 16)}`];
  }
};
