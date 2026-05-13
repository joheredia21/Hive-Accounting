import { useState, useEffect, FormEvent, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Wallet, Send, FileCheck, CheckCircle2, AlertCircle,
  Activity, BookOpen, ChevronDown, ChevronUp, Scale, Eye, EyeOff,
  ExternalLink, Hash, ArrowLeft
} from 'lucide-react';
import {
  checkKeychainAvailable,
  loginWithKeychain,
  broadcastPaymentWithLedger,
  registerExternalTxWithLedger,
  cleanUsername,
} from '../../services/hive-keychain';
import {
  buildJournalEntry,
  isJournalBalanced,
  AccountingJournal,
  CHART_OF_ACCOUNTS,
} from '../../types/accounting';
import LedgerHistory from './LedgerHistory';
import LanguageToggle from '../../components/common/LanguageToggle';

// ─── Journal Preview Component ────────────────────────────────────────────────

const JournalPreview = ({
  journal,
  visible,
}: {
  journal: AccountingJournal | null;
  visible: boolean;
}) => {
  if (!visible || !journal) return null;

  const totalDebits  = journal.lines.reduce((s, l) => s + l.debit,  0);
  const totalCredits = journal.lines.reduce((s, l) => s + l.credit, 0);
  const balanced     = isJournalBalanced(journal);

  return (
    <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/40 overflow-hidden animate-slide-up">
      {/* Header */}
      <div className="px-4 py-2.5 bg-indigo-50 border-b border-indigo-100 flex items-center gap-2">
        <Scale className="w-4 h-4 text-indigo-600" />
        <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">
          Journal Entry Preview
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
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-indigo-500 uppercase tracking-wide">
              <th className="px-4 py-2 font-semibold">Code</th>
              <th className="px-4 py-2 font-semibold">Account</th>
              <th className="px-4 py-2 font-semibold text-right">Debit</th>
              <th className="px-4 py-2 font-semibold text-right">Credit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-indigo-100/60">
            {journal.lines.map((line, i) => (
              <tr key={i} className="bg-white/60">
                <td className="px-4 py-2.5 font-mono text-gray-500">{line.account_code}</td>
                <td className="px-4 py-2.5 font-medium text-gray-800">{line.account_name}</td>
                <td className="px-4 py-2.5 text-right font-mono text-gray-700">
                  {line.debit > 0 ? line.debit.toFixed(3) : '—'}
                </td>
                <td className="px-4 py-2.5 text-right font-mono text-gray-700">
                  {line.credit > 0 ? line.credit.toFixed(3) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-indigo-50 font-bold text-indigo-800 text-xs">
              <td className="px-4 py-2" colSpan={2}>
                Total ({journal.currency})
              </td>
              <td className="px-4 py-2 text-right font-mono">{totalDebits.toFixed(3)}</td>
              <td className="px-4 py-2 text-right font-mono">{totalCredits.toFixed(3)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* JSON preview (collapsed) */}
      <details className="border-t border-indigo-100">
        <summary className="px-4 py-2 text-[10px] text-indigo-500 cursor-pointer hover:bg-indigo-50/60 transition-colors select-none">
          View raw JSON (on-chain payload)
        </summary>
        <pre className="px-4 py-3 bg-gray-900 text-green-300 text-[10px] leading-relaxed overflow-x-auto">
          {JSON.stringify(
            {
              app: 'hive-accounting/1.0',
              version: '1.0',
              action: 'journal_entry',
              timestamp: '<signed at broadcast>',
              journal,
            },
            null,
            2
          )}
        </pre>
      </details>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const AccountingDashboard = ({ onLogout }: { onLogout?: () => void }) => {
  const { t } = useTranslation();
  const [username, setUsername]               = useState('');
  const [isLoggedIn, setIsLoggedIn]           = useState(false);
  const [isKeychainAvailable, setIsKeychainAvailable] = useState(true);
  const [showLedger, setShowLedger]           = useState(false);
  const [showJournal, setShowJournal]         = useState(true);
  const [entryMode, setEntryMode]             = useState<'payment' | 'manual'>('payment');

  // Payment/Manual form
  const [receiver, setReceiver]   = useState('');
  const [amount, setAmount]       = useState('');
  const [currency, setCurrency]   = useState<'HIVE' | 'HBD'>('HBD');
  const [memo, setMemo]           = useState('Developer payment');
  const [debitAccount, setDebitAccount]   = useState('6.1.01');
  const [creditAccount, setCreditAccount] = useState('1.1.02');
  const [externalTx, setExternalTx]       = useState('');

  // UI state
  const [status, setStatus]               = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage]   = useState('');
  const [txId, setTxId]                   = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsKeychainAvailable(checkKeychainAvailable()), 500);
    return () => clearTimeout(timer);
  }, []);

  // Sync credit account when currency changes
  useEffect(() => {
    setCreditAccount(currency === 'HBD' ? '1.1.02' : '1.1.01');
  }, [currency]);

  // Build journal preview reactively from form values
  const journalPreview: AccountingJournal | null = useMemo(() => {
    const parsedAmount = parseFloat(amount);
    if ((entryMode === 'payment' && !receiver) || !parsedAmount || parsedAmount <= 0) return null;
    return buildJournalEntry({
      receiver: entryMode === 'payment' ? receiver : 'External Entity',
      amount: parsedAmount,
      currency,
      memo: memo || (entryMode === 'payment' ? 'Payment' : 'Manual Entry'),
      debitAccountCode: debitAccount,
      creditAccountCode: creditAccount,
    });
  }, [receiver, amount, currency, memo, debitAccount, creditAccount, entryMode]);

  const handleLogin = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    const cleanAccount = cleanUsername(username);
    if (!cleanAccount) return;
    
    try {
      setStatus('processing');
      setErrorMessage('');
      await loginWithKeychain(cleanAccount);
      setUsername(cleanAccount); // Update state to cleaned version
      setIsLoggedIn(true);
      setStatus('idle');
    } catch (err: unknown) {
      console.error('Login error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Login error');
      setStatus('error');
    }
  }, [username]);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (entryMode === 'payment' && (!receiver || !amount || isNaN(Number(amount)) || Number(amount) <= 0)) {
      setErrorMessage('Please enter a valid recipient and amount.');
      setStatus('error');
      return;
    }
    if (entryMode === 'manual' && (!externalTx || !amount)) {
      setErrorMessage('Please enter external TX and amount.');
      setStatus('error');
      return;
    }
    if (!journalPreview) return;

    try {
      setStatus('processing');
      setErrorMessage('');

      let response;
      if (entryMode === 'payment') {
        response = await broadcastPaymentWithLedger(
          username,
          receiver,
          amount,
          currency,
          memo,
          journalPreview
        );
      } else {
        // Clean up externalTx in case it's a link
        const cleanTx = externalTx.split('/').pop()?.split('?')[0] || externalTx;
        response = await registerExternalTxWithLedger(
          username,
          cleanTx,
          journalPreview
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = response.result as any;
      const transactionId =
        result?.id ||
        result?.trx_id ||
        result?.tx_id ||
        '';
      setTxId(transactionId);
      setStatus('success');

      // Reset form
      setReceiver('');
      setAmount('');
      setExternalTx('');
      setMemo(entryMode === 'payment' ? 'Developer payment' : 'Manual Entry');
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'Transaction error');
      setStatus('error');
    }
  }, [entryMode, receiver, amount, externalTx, journalPreview, username, currency, memo]);

  // ── Keychain not installed ────────────────────────────────────────────────
  if (!isKeychainAvailable) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-gray-100">
        <AlertCircle className="w-16 h-16 text-hive-red mb-4" />
        <h2 className="text-2xl font-bold text-hive-dark mb-2">Hive Keychain Not Detected</h2>
        <p className="text-hive-gray text-center max-w-md">
          Please install the Hive Keychain browser extension to use this accounting portal.
        </p>
        <a
          href="https://hive-keychain.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 px-6 py-2 bg-hive-red text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Download Keychain
        </a>
      </div>
    );
  }

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto mt-10">
        <div className="bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 animate-slide-up">
          <button 
            onClick={onLogout}
            className="mb-6 flex items-center gap-1 text-xs font-bold text-hive-gray hover:text-hive-red transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          <div className="flex justify-center mb-6">
            <img 
              src="https://files.peakd.com/file/peakd-hive/joheredia21/23uQtuwkDLZfCzn6YTdXZFTf64Xe3xMLBUMFT3LTNicRjk43MCUWgsUGaXfS59WFPbHZu.png" 
              alt="Hive Accounting" 
              className="w-16 h-16 object-contain"
            />
          </div>
          <h2 className="text-2xl font-bold text-center text-hive-dark mb-2">Sign In</h2>
          <p className="text-hive-gray text-center mb-8">
            Connect your Hive account to access the accounting ledger.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hive Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-hive-red focus:border-transparent transition-all outline-none"
                  placeholder="username"
                  required
                />
              </div>
            </div>

            {status === 'error' && (
              <div className="p-3 bg-red-50 text-hive-red rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'processing' || !username}
              className="w-full py-3 px-4 bg-hive-red hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {status === 'processing' ? (
                <Activity className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Wallet className="w-5 h-5" />
                  Connect with Keychain
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Main dashboard ────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onLogout}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-hive-gray"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <p className="text-sm text-hive-gray font-medium uppercase tracking-wider">{t('dashboard.active_account')}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-8 h-8 bg-gradient-to-tr from-hive-red to-orange-500 rounded-full shadow-inner flex items-center justify-center text-white font-bold">
                {username.charAt(0).toUpperCase()}
              </div>
              <h2 className="text-xl font-bold text-hive-dark">@{username}</h2>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <button
            onClick={() => setShowLedger(!showLedger)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-bold text-hive-dark hover:bg-gray-50 transition-all shadow-sm"
          >
            <BookOpen className="w-4 h-4 text-hive-red" />
            {showLedger ? t('dashboard.hide_ledger') : t('dashboard.view_ledger')}
            {showLedger ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <div className="hidden sm:flex bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium items-center gap-2 border border-green-100">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            {t('dashboard.connected')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── Entry Form ─────────────────────────────────────────────────── */}
        <div className="bg-white p-8 rounded-2xl shadow-xl shadow-gray-200/40 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                {entryMode === 'payment' ? <Send className="w-6 h-6 text-hive-red" /> : <Hash className="w-6 h-6 text-hive-red" />}
              </div>
              <h3 className="text-xl font-bold text-hive-dark">
                {entryMode === 'payment' ? t('dashboard.new_payment') : t('dashboard.manual_entry')}
              </h3>
            </div>
            
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button 
                onClick={() => setEntryMode('payment')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${entryMode === 'payment' ? 'bg-white shadow-sm text-hive-red' : 'text-hive-gray'}`}
              >
                PAY
              </button>
              <button 
                onClick={() => setEntryMode('manual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${entryMode === 'manual' ? 'bg-white shadow-sm text-hive-red' : 'text-hive-gray'}`}
              >
                MANUAL
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Context Sensitive Field */}
            {entryMode === 'payment' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">@</span>
                  <input
                    type="text"
                    value={receiver}
                    onChange={(e) => setReceiver(e.target.value.toLowerCase())}
                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-hive-red focus:border-transparent transition-all outline-none"
                    placeholder="username"
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference TX (ID or Link)</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">#</span>
                  <input
                    type="text"
                    value={externalTx}
                    onChange={(e) => setExternalTx(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-hive-red focus:border-transparent transition-all outline-none"
                    placeholder={t('dashboard.tx_placeholder')}
                    required
                  />
                </div>
                <p className="mt-1 text-[10px] text-hive-gray italic">
                  * No funds will be transferred. This only records the accounting entry referencing this TX.
                </p>
              </div>
            )}

            {/* Amount + Currency */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-hive-red focus:border-transparent transition-all outline-none font-mono"
                  placeholder="0.000"
                  required
                />
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as 'HIVE' | 'HBD')}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-hive-red focus:border-transparent transition-all outline-none cursor-pointer"
                >
                  <option value="HBD">HBD</option>
                  <option value="HIVE">HIVE</option>
                </select>
              </div>
            </div>

            {/* Memo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Memo / Description</label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-hive-red focus:border-transparent transition-all outline-none"
                placeholder="Payment description"
                required
              />
            </div>

            {/* Account Codes */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                  Debit Account
                </label>
                <select
                  value={debitAccount}
                  onChange={(e) => setDebitAccount(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none cursor-pointer"
                >
                  {Object.entries(CHART_OF_ACCOUNTS)
                    .filter(([code]) => code.startsWith('5') || code.startsWith('6'))
                    .map(([code, name]) => (
                      <option key={code} value={code}>{code} – {name}</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                  Credit Account
                </label>
                <select
                  value={creditAccount}
                  onChange={(e) => setCreditAccount(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none cursor-pointer"
                >
                  {Object.entries(CHART_OF_ACCOUNTS)
                    .filter(([code]) => code.startsWith('1'))
                    .map(([code, name]) => (
                      <option key={code} value={code}>{code} – {name}</option>
                    ))}
                </select>
              </div>
            </div>

            {/* Journal preview toggle */}
            {journalPreview && (
              <button
                type="button"
                onClick={() => setShowJournal(!showJournal)}
                className="flex items-center gap-2 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                {showJournal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showJournal ? 'Hide journal entry preview' : 'Show journal entry preview'}
              </button>
            )}

            {/* Inline journal preview */}
            <JournalPreview journal={journalPreview} visible={showJournal} />

            {status === 'error' && (
              <div className="p-4 bg-red-50 border border-red-100 text-hive-red rounded-xl text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{errorMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'processing' || !journalPreview}
              className="w-full py-4 bg-hive-red hover:bg-red-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 disabled:opacity-70 mt-4 active:scale-95"
            >
              {status === 'processing' ? (
                <>
                  <Activity className="w-5 h-5 animate-spin" />
                  Broadcasting to Blockchain...
                </>
              ) : (
                <>
                  {entryMode === 'payment' ? t('dashboard.confirm_payment') : t('dashboard.register_tx')}
                  <Send className="w-5 h-5 ml-1" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* ── Right Column ─────────────────────────────────────────────────── */}
        <div className="space-y-6">
          {/* How it works */}
          <div className="bg-gradient-to-br from-hive-dark to-gray-800 p-8 rounded-2xl shadow-xl text-white">
            <div className="flex items-center gap-3 mb-4">
              <FileCheck className="w-6 h-6 text-red-400" />
              <h3 className="text-lg font-bold">Atomic On-Chain Audit</h3>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              {entryMode === 'payment' 
                ? "Each payment broadcasts a transfer and a custom_json journal entry in one atomic transaction — one Keychain prompt, one block, one TX ID."
                : "Registering an external TX records a custom_json referencing the source transaction. This ensures audits cover all asset movements."
              }
            </p>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                <span>Signed with Active Key (Keychain)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                <span>Double-entry accounting on-chain</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                <span>Auditable on any Hive block explorer</span>
              </li>
            </ul>
          </div>

          {/* Success state */}
          {status === 'success' && (
            <div className="bg-white p-6 rounded-2xl shadow-lg shadow-green-100 border border-green-200 animate-slide-up">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Transaction Confirmed!</h3>
                <p className="text-gray-500 text-xs mb-5">
                  {entryMode === 'payment' 
                    ? "Transfer + journal entry recorded atomically on Hive blockchain."
                    : "Manual ledger entry successfully linked to external TX."
                  }
                </p>

                <div className="w-full bg-gray-50 rounded-xl p-4 text-left border border-gray-100 space-y-2">
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">
                    {entryMode === 'payment' ? 'Transaction ID' : 'Entry TX ID'}
                  </p>
                  <p className="font-mono text-xs text-gray-800 break-all">{txId || '—'}</p>
                  <div className="flex gap-2 pt-1">
                    <a
                      href={`https://hivehub.dev/tx/${txId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-medium text-hive-red hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      HiveHub
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ledger Table */}
      {showLedger && (
        <div className="animate-slide-up">
          <LedgerHistory username={username} />
        </div>
      )}
    </div>
  );
};

export default AccountingDashboard;
