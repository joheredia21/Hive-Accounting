/**
 * Hive Keychain Service
 *
 * Wraps the browser extension injected at window.hive_keychain.
 * Key function: broadcastPaymentWithLedger() – emits a TRANSFER +
 * CUSTOM_JSON in a single atomic broadcast so both operations share
 * the same transaction ID on-chain and can be audited together.
 */

import { AccountingJournal, AccountingPayload } from '../types/accounting';

// ─── Global type augmentation ─────────────────────────────────────────────────

declare global {
  interface Window {
    hive_keychain?: {
      requestHandshake(callback: () => void): void;

      requestSignBuffer(
        account: string,
        message: string,
        key: 'Posting' | 'Active' | 'Memo',
        callback: (response: KeychainResponse) => void
      ): void;

      requestTransfer(
        account: string,
        to: string,
        amount: string,
        memo: string,
        currency: 'HIVE' | 'HBD',
        callback: (response: KeychainResponse) => void,
        enforce?: boolean
      ): void;

      requestCustomJson(
        account: string,
        id: string,
        key: 'Posting' | 'Active',
        json: string,
        display_name: string,
        callback: (response: KeychainResponse) => void
      ): void;

      /**
       * Broadcasts an array of Hive operations in a single transaction.
       * All operations share the same trx_id, making them atomic.
       * Requires the appropriate key for the operations included.
       *
       * @param account   - Signing account
       * @param operations - Array of [operation_type, operation_body] tuples
       * @param key       - 'Active' for transfers / financial ops
       * @param callback  - Called with the broadcast result
       */
      requestBroadcast(
        account: string,
        operations: [string, Record<string, unknown>][],
        key: 'Posting' | 'Active' | 'Memo',
        callback: (response: KeychainResponse) => void
      ): void;
    };
  }
}

// ─── Response type ────────────────────────────────────────────────────────────

export interface KeychainResponse {
  success: boolean;
  message: string;
  result: any;
  data: any;
  request_id: number;
}

// ─── Basic helpers ────────────────────────────────────────────────────────────

export const checkKeychainAvailable = (): boolean =>
  typeof window !== 'undefined' && !!window.hive_keychain;

export const loginWithKeychain = (username: string): Promise<KeychainResponse> =>
  new Promise((resolve, reject) => {
    if (!checkKeychainAvailable()) {
      reject(new Error('Hive Keychain is not installed'));
      return;
    }
    window.hive_keychain!.requestSignBuffer(
      username,
      `Login to Hive Accounting – ${Date.now()}`,
      'Posting',
      (response) => {
        if (response.success) resolve(response);
        else reject(new Error(response.message));
      }
    );
  });

// ─── Legacy single-step functions (kept for backward compat) ──────────────────

export const transferFunds = (
  sender: string,
  receiver: string,
  amount: string,
  currency: 'HIVE' | 'HBD',
  memo: string = ''
): Promise<KeychainResponse> =>
  new Promise((resolve, reject) => {
    if (!checkKeychainAvailable()) {
      reject(new Error('Hive Keychain is not installed'));
      return;
    }
    const formattedAmount = Number(amount).toFixed(3);
    window.hive_keychain!.requestTransfer(
      sender, receiver, formattedAmount, memo, currency,
      (response) => {
        if (response.success) resolve(response);
        else reject(new Error(response.message));
      }
    );
  });

export const registerLedgerEntry = (
  account: string,
  transactionData: any
): Promise<KeychainResponse> =>
  new Promise((resolve, reject) => {
    if (!checkKeychainAvailable()) {
      reject(new Error('Hive Keychain is not installed'));
      return;
    }
    const payload = {
      app: 'hive-accounting/1.0',
      action: 'register_payment',
      timestamp: new Date().toISOString(),
      data: transactionData,
    };
    window.hive_keychain!.requestCustomJson(
      account, 'hive_accounting_ledger', 'Active',
      JSON.stringify(payload), 'Register accounting entry',
      (response) => {
        if (response.success) resolve(response);
        else reject(new Error(response.message));
      }
    );
  });

// ─── NEW: Atomic broadcast (transfer + custom_json in one TX) ─────────────────

/**
 * Broadcasts a TRANSFER and a CUSTOM_JSON accounting entry as a single
 * atomic Hive transaction.
 *
 * Both operations are signed with the Active key and share one trx_id,
 * so the payment and its ledger record are permanently linked on-chain.
 *
 * The returned KeychainResponse.result.id contains the transaction hash
 * which can be used directly for audit links on HiveHub / Hive Explorer.
 *
 * @param sender   - Hive username initiating the payment
 * @param receiver - Recipient Hive username
 * @param amount   - Amount as string (will be formatted to 3 decimals)
 * @param currency - 'HIVE' or 'HBD'
 * @param memo     - Transfer memo
 * @param journal  - Full double-entry journal built via buildJournalEntry()
 */
export const broadcastPaymentWithLedger = (
  sender: string,
  receiver: string,
  amount: string,
  currency: 'HIVE' | 'HBD',
  memo: string,
  journal: AccountingJournal
): Promise<KeychainResponse> =>
  new Promise((resolve, reject) => {
    if (!checkKeychainAvailable()) {
      reject(new Error('Hive Keychain is not installed'));
      return;
    }

    const formattedAmount = `${Number(amount).toFixed(3)} ${currency}`;

    // Build the accounting payload that will live on-chain as custom_json
    const accountingPayload: AccountingPayload = {
      app: 'hive-accounting/1.0',
      version: '1.0',
      action: 'journal_entry',
      timestamp: new Date().toISOString(),
      journal,
    };

    // Two Hive operations bundled into one transaction
    const operations: [string, Record<string, unknown>][] = [
      [
        'transfer',
        {
          from: sender,
          to: receiver,
          amount: formattedAmount,
          memo,
        },
      ],
      [
        'custom_json',
        {
          required_auths: [sender],          // Active auth (financial op)
          required_posting_auths: [],
          id: 'hive_accounting_ledger',
          json: JSON.stringify(accountingPayload),
        },
      ],
    ];

    window.hive_keychain!.requestBroadcast(
      sender,
      operations,
      'Active',                             // Active key signs both ops
      (response) => {
        if (response.success) resolve(response);
        else reject(new Error(response.message));
      }
    );
  });
