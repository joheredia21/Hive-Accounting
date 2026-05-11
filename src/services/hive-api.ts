import { Client } from '@hiveio/dhive';
import { AccountingJournal, JournalLine } from '../types/accounting';

const HIVE_NODES = [
  'https://api.hive.blog',
  'https://api.deathwing.me',
  'https://api.openhive.network',
];

export const client = new Client(HIVE_NODES, {
  timeout: 15000,
});

// ─── LedgerEntry ─────────────────────────────────────────────────────────────

export interface LedgerEntry {
  timestamp: string;
  type: 'expense' | 'transfer';
  category: string;
  amount: number;
  currency: string;
  receiver: string;
  memo: string;
  reference_tx: string;   // trx_id of the transfer or external reference
  txId: string;           // trx_id of the custom_json
  source: 'ledger' | 'transfer';
  externalReference?: string;
  /** Full double-entry journal (present only for new-format entries) */
  journal?: AccountingJournal;
}

// ─── History fetcher ─────────────────────────────────────────────────────────

/**
 * Downloads the full account history in pages of 1 000, filtering for:
 *  - custom_json with id 'hive_accounting_ledger'  (new & legacy formats)
 *  - outgoing transfers (fallback for entries without a custom_json)
 *
 * Up to 10 pages (10 000 operations) are traversed.
 */
export const fetchLedgerHistory = async (username: string): Promise<LedgerEntry[]> => {
  const MAX_PAGES = 10;
  const PAGE_SIZE = 1000;

  const transferMap: Map<string, LedgerEntry> = new Map();
  const ledgerMap:   Map<string, LedgerEntry> = new Map();

  let startIndex  = -1;    // -1 = most recent
  let pagesFetched = 0;
  let reachedEnd   = false;

  while (pagesFetched < MAX_PAGES && !reachedEnd) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let history: [number, any][];
    try {
      history = await client.call('condenser_api', 'get_account_history', [
        username,
        startIndex,
        PAGE_SIZE,
      ]);
    } catch (err: unknown) {
      console.error('Error fetching account history:', err);
      break;
    }

    if (!history || history.length === 0) {
      reachedEnd = true;
      break;
    }

    for (const item of history) {
      const globalSeq: number = item[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const txData: any        = item[1];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const op: any            = txData.op;
      const opType: string     = op[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const opBody: any        = op[1];

      // ── CASE 1: custom_json from our ledger ──────────────────────────────
      if (opType === 'custom_json' && opBody.id === 'hive_accounting_ledger') {
        try {
          const json = JSON.parse(opBody.json);
          const key: string = txData.trx_id;

          if (!ledgerMap.has(key)) {
            // ── NEW FORMAT: action === 'journal_entry' ──────────────────────
            if (json.action === 'journal_entry' && json.journal) {
              const journal: AccountingJournal = json.journal;

              // Derive amount from sum of debit lines
              const totalDebit = journal.lines.reduce(
                (s: number, l: JournalLine) => s + (Number(l.debit) || 0), 0
              );
              // Derive category from the first debit account name
              const debitLine = journal.lines.find((l: JournalLine) => Number(l.debit) > 0);

              ledgerMap.set(key, {
                timestamp:    txData.timestamp,
                type:         'expense',
                category:     debitLine?.account_name ?? 'expense',
                amount:       totalDebit,
                currency:     journal.currency ?? 'HIVE',
                receiver:     journal.payee ?? '',
                memo:         journal.description ?? '',
                reference_tx: json.external_reference ?? txData.trx_id,
                txId:         txData.trx_id,
                source:       'ledger',
                externalReference: json.external_reference,
                journal,
              });

            // ── LEGACY FORMAT: data.amount / data.receiver ─────────────────
            } else {
              const data = json.data ?? json;
              if (data.amount !== undefined && data.receiver !== undefined) {
                ledgerMap.set(key, {
                  timestamp:    txData.timestamp,
                  type:         data.type ?? 'expense',
                  category:     data.category ?? 'developer_payment',
                  amount:       Number(data.amount),
                  currency:     data.currency ?? 'HIVE',
                  receiver:     data.receiver,
                  memo:         data.memo ?? '',
                  reference_tx: data.reference_tx ?? txData.trx_id,
                  txId:         txData.trx_id,
                  source:       'ledger',
                });
              }
            }
          }
        } catch (e) {
          console.warn('Error parsing custom_json:', e);
        }
      }

      // ── CASE 2: outgoing transfer (fallback / full audit trail) ───────────
      if (opType === 'transfer' && opBody.from === username) {
        const key: string = txData.trx_id;
        if (!transferMap.has(key)) {
          const amountValue = opBody.amount;
          const [amountStr, currency] = typeof amountValue === 'string' 
            ? amountValue.split(' ') 
            : [String(amountValue), 'HIVE'];
          
          transferMap.set(key, {
            timestamp:    txData.timestamp,
            type:         'transfer',
            category:     'transfer',
            amount:       parseFloat(amountStr),
            currency:     currency ?? 'HIVE',
            receiver:     opBody.to,
            memo:         opBody.memo ?? '',
            reference_tx: txData.trx_id,
            txId:         txData.trx_id,
            source:       'transfer',
          });
        }
      }

      // Advance cursor towards older history
      if (globalSeq === 0) {
        reachedEnd = true;
      } else {
        startIndex = globalSeq - 1;
      }
    }

    if (history.length < PAGE_SIZE) reachedEnd = true;
    pagesFetched++;
  }

  // ── Merge: ledger entries take precedence; plain transfers fill the gaps ──
  const result: LedgerEntry[] = [];

  for (const entry of ledgerMap.values()) {
    result.push(entry);
    // Remove transfer with same trx_id — it's already covered by the journal
    transferMap.delete(entry.reference_tx);
    transferMap.delete(entry.txId);
  }

  for (const entry of transferMap.values()) {
    result.push({ ...entry, category: 'transfer_no_record' });
  }

  // Sort newest first
  result.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return result;
};
