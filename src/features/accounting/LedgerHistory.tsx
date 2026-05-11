import { useState, useEffect, useCallback } from 'react';
import {
  History, ExternalLink, RefreshCw, Search, FileText,
  AlertTriangle, ChevronDown, ChevronUp, Scale,
} from 'lucide-react';
import { fetchLedgerHistory, LedgerEntry } from '../../services/hive-api';
import { JournalLine } from '../../types/accounting';

interface LedgerHistoryProps {
  username: string;
}

// ─── Source badge ─────────────────────────────────────────────────────────────

const SourceBadge = ({ source }: { source: LedgerEntry['source'] }) => {
  if (source === 'ledger') {
    return (
      <span className="px-2 py-0.5 bg-green-50 text-green-700 text-[10px] rounded-full uppercase font-bold border border-green-100">
        ✓ On-chain
      </span>
    );
  }
  return (
    <span
      title="Transfer occurred but the accounting custom_json was not completed. Shown anyway for full audit trail."
      className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] rounded-full uppercase font-bold border border-amber-100 cursor-help"
    >
      ⚠ No Record
    </span>
  );
};

// ─── Expandable journal lines ─────────────────────────────────────────────────

const JournalLines = ({ lines, currency }: { lines: JournalLine[]; currency: string }) => {
  const totalDebits  = lines.reduce((s, l) => s + l.debit,  0);
  const totalCredits = lines.reduce((s, l) => s + l.credit, 0);
  const balanced     = Math.abs(totalDebits - totalCredits) < 0.0001;

  return (
    <tr className="bg-indigo-50/40">
      <td colSpan={7} className="px-6 pb-4 pt-0">
        <div className="rounded-xl border border-indigo-100 overflow-hidden">
          {/* Sub-header */}
          <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2">
            <Scale className="w-3.5 h-3.5 text-indigo-600" />
            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide">
              Journal Entry
            </span>
            {balanced ? (
              <span className="ml-auto text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                ✓ Balanced
              </span>
            ) : (
              <span className="ml-auto text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full border border-red-200">
                ✗ Unbalanced
              </span>
            )}
          </div>

          {/* Lines table */}
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-white text-indigo-400 uppercase tracking-wide">
                <th className="px-4 py-2 text-left font-semibold">Code</th>
                <th className="px-4 py-2 text-left font-semibold">Account</th>
                <th className="px-4 py-2 text-right font-semibold">Debit</th>
                <th className="px-4 py-2 text-right font-semibold">Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-50">
              {lines.map((line, i) => (
                <tr key={i} className="bg-white/80 hover:bg-indigo-50/30 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-gray-500">{line.account_code}</td>
                  <td className="px-4 py-2.5 font-medium text-gray-800">{line.account_name}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-gray-700">
                    {line.debit > 0 ? (
                      <span className="text-red-600 font-semibold">
                        {line.debit.toFixed(3)} {currency}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-gray-700">
                    {line.credit > 0 ? (
                      <span className="text-green-600 font-semibold">
                        {line.credit.toFixed(3)} {currency}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-indigo-50 font-bold text-indigo-800 text-[10px]">
                <td className="px-4 py-2" colSpan={2}>Totals ({currency})</td>
                <td className="px-4 py-2 text-right font-mono">{totalDebits.toFixed(3)}</td>
                <td className="px-4 py-2 text-right font-mono">{totalCredits.toFixed(3)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </td>
    </tr>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const LedgerHistory = ({ username }: LedgerHistoryProps) => {
  const [entries, setEntries]       = useState<LedgerEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await fetchLedgerHistory(username);
      setEntries(data);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (username) loadHistory();
  }, [username, loadHistory]);

  const toggleRow = (txId: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(txId)) next.delete(txId);
      else next.add(txId);
      return next;
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/40 border border-gray-100 overflow-hidden">

      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-50 rounded-lg">
            <History className="w-5 h-5 text-hive-dark" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-hive-dark">General Ledger</h3>
            <p className="text-xs text-hive-gray mt-0.5">
              Full history of{' '}
              <span className="font-mono font-bold">@{username}</span>{' '}
              on the Hive blockchain
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!loading && (
            <span className="text-xs text-hive-gray">
              {entries.length} record{entries.length !== 1 ? 's' : ''}
            </span>
          )}
          <button
            onClick={loadHistory}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors text-hive-gray disabled:opacity-50"
            title="Refresh history"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Legend */}
      {!loading && entries.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4 text-xs text-hive-gray">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            <strong>On-chain</strong>: transfer + double-entry journal complete
          </span>
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <strong>No Record</strong>: transfer only, custom_json not completed
          </span>
          <span className="flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-indigo-500" />
            Click <strong>Journal</strong> icon to expand the accounting entry
          </span>
        </div>
      )}

      {/* Body */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-hive-red border-t-transparent rounded-full animate-spin" />
            <p className="text-hive-gray text-sm animate-pulse">Querying the Hive blockchain...</p>
            <p className="text-gray-400 text-xs">This may take a few seconds</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <p className="text-red-500 font-medium">Error loading history.</p>
            <button onClick={loadHistory} className="mt-4 text-hive-red hover:underline text-sm">
              Retry
            </button>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <Search className="w-12 h-12 text-gray-200 mb-4" />
            <p className="text-hive-gray text-sm">No transactions found for this account.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-hive-gray text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Date</th>
                <th className="px-6 py-4 font-semibold">Description</th>
                <th className="px-6 py-4 font-semibold">Recipient</th>
                <th className="px-6 py-4 font-semibold text-right">Amount</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
                <th className="px-6 py-4 font-semibold text-center">Journal</th>
                <th className="px-6 py-4 font-semibold text-center">Audit</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => {
                const rowKey = `${entry.txId}-${idx}`;
                const isExpanded = expandedRows.has(rowKey);
                const hasJournal = !!entry.journal?.lines?.length;

                return (
                  <>
                    <tr
                      key={rowKey}
                      className={`hover:bg-gray-50 transition-colors border-t border-gray-50 ${
                        entry.source === 'transfer' ? 'bg-amber-50/30' : ''
                      } ${isExpanded ? 'bg-indigo-50/20' : ''}`}
                    >
                      {/* Date */}
                      <td className="px-6 py-4 text-sm text-hive-gray whitespace-nowrap">
                        {new Date(entry.timestamp + 'Z').toLocaleDateString('en-US', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                        <span className="block text-[10px] text-gray-400">
                          {new Date(entry.timestamp + 'Z').toLocaleTimeString([], {
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="px-6 py-4 max-w-[200px]">
                        <p className="text-sm font-medium text-hive-dark truncate">
                          {entry.memo || '—'}
                        </p>
                        {entry.category && entry.category !== 'transfer' && (
                          <span className="mt-0.5 px-1.5 py-0.5 bg-red-50 text-hive-red text-[10px] rounded-full uppercase font-bold inline-block">
                            {entry.category.replace(/_/g, ' ')}
                          </span>
                        )}
                        {entry.externalReference && (
                          <span className="ml-1 mt-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded-full uppercase font-bold inline-block">
                            EXT REF
                          </span>
                        )}
                      </td>

                      {/* Recipient */}
                      <td className="px-6 py-4 text-sm text-hive-dark font-mono">
                        @{entry.receiver}
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <span className="text-sm font-bold text-hive-dark">
                          {entry.amount.toFixed(3)}
                        </span>
                        <span className="ml-1 text-[10px] text-hive-gray font-bold">
                          {entry.currency}
                        </span>
                      </td>

                      {/* Status badge */}
                      <td className="px-6 py-4 text-center">
                        <SourceBadge source={entry.source} />
                      </td>

                      {/* Journal expand button */}
                      <td className="px-6 py-4 text-center">
                        {hasJournal ? (
                          <button
                            onClick={() => toggleRow(rowKey)}
                            className={`p-1.5 rounded-lg transition-all inline-flex items-center gap-1 text-[10px] font-bold ${
                              isExpanded
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'hover:bg-indigo-50 text-indigo-400 hover:text-indigo-700'
                            }`}
                            title="View journal entry"
                          >
                            <Scale className="w-3.5 h-3.5" />
                            {isExpanded
                              ? <ChevronUp className="w-3 h-3" />
                              : <ChevronDown className="w-3 h-3" />}
                          </button>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Audit links */}
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-1">
                          <a
                            href={`https://hivehub.dev/tx/${entry.reference_tx}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-red-50 text-hive-gray hover:text-hive-red rounded-lg transition-all"
                            title="View on HiveHub"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          {entry.source === 'ledger' && entry.txId !== entry.reference_tx && (
                            <a
                              href={`https://hivehub.dev/tx/${entry.txId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 hover:bg-red-50 text-hive-gray hover:text-hive-red rounded-lg transition-all"
                              title="View journal entry (custom_json) on HiveHub"
                            >
                              <FileText className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded journal lines */}
                    {isExpanded && hasJournal && (
                      <JournalLines
                        key={`journal-${rowKey}`}
                        lines={entry.journal!.lines}
                        currency={entry.currency}
                      />
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default LedgerHistory;
