export interface ZendUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  walletAddress: `0x${string}`;
  createdAt: string;
}

export interface ZendContact {
  user: ZendUser;
  isFavorite: boolean;
  lastPaidAt?: string;
}

export type TxDirection = "sent" | "received";
export type TxStatus = "pending" | "complete" | "failed";

export interface ZendTransactionRecord {
  id: string;
  hash?: `0x${string}`;
  direction: TxDirection;
  status: TxStatus;
  counterparty: Pick<ZendUser, "username" | "displayName" | "avatarUrl">;
  amountUsdc: string; // human readable, e.g. "42.50"
  feeUsdc: string;
  note?: string;
  createdAt: string;
}

export type ApiError = {
  code:
    | "USERNAME_TAKEN"
    | "INVALID_USERNAME"
    | "USER_NOT_FOUND"
    | "INSUFFICIENT_BALANCE"
    | "INSUFFICIENT_FEE_BALANCE"
    | "RECIPIENT_BLOCKLISTED"
    | "SENDER_BLOCKLISTED"
    | "RPC_UNAVAILABLE"
    | "OFFLINE"
    | "EMAIL_VERIFICATION_FAILED"
    | "WALLET_CREATION_FAILED"
    | "RATE_LIMITED"
    | "TX_DROPPED"
    | "UNKNOWN";
  message: string;
};
