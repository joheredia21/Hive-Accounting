/**
 * Hive Accounting – Chart of Accounts & Journal Entry Types
 *
 * Each payment broadcast includes a `custom_json` operation with
 * action: "journal_entry" that encodes a double-entry journal line
 * anchored permanently to the Hive blockchain.
 */

// ─── Chart of Accounts (English, standard Latin-American structure) ───────────

export const CHART_OF_ACCOUNTS: Record<string, string> = {
  // 1. Assets
  '1.1.01': 'Cash - Digital Wallet (HIVE)',
  '1.1.02': 'Cash - Digital Wallet (HBD)',
  '1.1.03': 'Accounts Receivable',
  '1.2.01': 'Fixed Assets - Equipment',

  // 2. Liabilities
  '2.1.01': 'Accounts Payable',
  '2.1.02': 'Short-Term Loans Payable',

  // 3. Equity / Capital
  '3.1.01': 'Owner Equity',
  '3.2.01': 'Retained Earnings',

  // 4. Revenue
  '4.1.01': 'Sales Revenue',
  '4.1.02': 'Service Revenue',

  // 5. Cost of Goods Sold
  '5.1.01': 'Cost of Goods Sold',

  // 6. Operating Expenses
  '6.1.01': 'Operating Expenses - Development',
  '6.1.02': 'Operating Expenses - Professional Services',
  '6.1.03': 'Operating Expenses - Marketing',
  '6.2.01': 'Administrative Expenses - General',
  '6.2.02': 'Administrative Expenses - Software & Tools',
  '6.3.01': 'Financial Expenses - Transaction Fees',
};

// ─── Interfaces ───────────────────────────────────────────────────────────────

/** A single debit or credit line in the journal */
export interface JournalLine {
  account_code: string;  // e.g. "6.1.01"
  account_name: string;  // e.g. "Operating Expenses - Development"
  debit: number;         // 0 if this is a credit line
  credit: number;        // 0 if this is a debit line
}

/** The complete double-entry journal for one transaction */
export interface AccountingJournal {
  id: string;                   // Local UUID (for reference)
  date: string;                 // ISO date: YYYY-MM-DD
  description: string;          // Free-text memo
  payee: string;                // Hive username of the recipient
  currency: 'HIVE' | 'HBD';
  lines: JournalLine[];         // Must balance: Σdebits === Σcredits
}

/** Full payload emitted as custom_json on Hive */
export interface AccountingPayload {
  app: 'hive-accounting/1.0';
  version: '1.0';
  action: 'journal_entry';
  timestamp: string;            // ISO 8601
  journal: AccountingJournal;
  external_reference?: string;
}

// ─── Helper utilities ─────────────────────────────────────────────────────────

/** Deterministic UUID v4 generator (no external dependency) */
export const generateUUID = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

/**
 * Builds a balanced double-entry journal from payment parameters.
 * Default accounts:
 *   Debit  → 6.1.01 Operating Expenses - Development
 *   Credit → 1.1.01/02 Cash - Digital Wallet (HIVE or HBD)
 *
 * Both accounts can be overridden for different transaction types.
 */
export const buildJournalEntry = (params: {
  receiver: string;
  amount: number;
  currency: 'HIVE' | 'HBD';
  memo: string;
  debitAccountCode?: string;
  creditAccountCode?: string;
}): AccountingJournal => {
  const {
    receiver,
    amount,
    currency,
    memo,
    debitAccountCode = '6.1.01',
    creditAccountCode = currency === 'HBD' ? '1.1.02' : '1.1.01',
  } = params;

  return {
    id: generateUUID(),
    date: new Date().toISOString().split('T')[0],
    description: memo,
    payee: receiver,
    currency,
    lines: [
      {
        account_code: debitAccountCode,
        account_name: CHART_OF_ACCOUNTS[debitAccountCode] ?? debitAccountCode,
        debit: amount,
        credit: 0,
      },
      {
        account_code: creditAccountCode,
        account_name: CHART_OF_ACCOUNTS[creditAccountCode] ?? creditAccountCode,
        debit: 0,
        credit: amount,
      },
    ],
  };
};

/** Verify that a journal's debits and credits are balanced */
export const isJournalBalanced = (journal: AccountingJournal): boolean => {
  const totalDebits  = journal.lines.reduce((s, l) => s + l.debit,  0);
  const totalCredits = journal.lines.reduce((s, l) => s + l.credit, 0);
  return Math.abs(totalDebits - totalCredits) < 0.0001; // float tolerance
};
