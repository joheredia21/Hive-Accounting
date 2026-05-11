import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ShieldCheck, Download, Share2 } from 'lucide-react';
import LedgerHistory from '../accounting/LedgerHistory';
import LanguageToggle from '../../components/common/LanguageToggle';

interface AuditViewerProps {
  account: string;
  onBack: () => void;
}

const AuditViewer = ({ account, onBack }: AuditViewerProps) => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-hive-light pb-20">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass px-6 py-4 mb-12">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-hive-dark"
              title={t('audit.back')}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-black text-hive-dark">{t('audit.title')}</h1>
              <p className="text-xs text-hive-gray font-bold uppercase tracking-wider">
                Account: @{account}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <button className="hidden sm:flex items-center gap-2 px-4 py-2 bg-hive-dark text-white text-xs font-bold rounded-lg hover:bg-black transition-all shadow-md">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-tr from-hive-red to-orange-500 rounded-2xl shadow-lg flex items-center justify-center text-white font-black text-2xl">
              {account.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-3xl font-black text-hive-dark">@{account}</h2>
                <div className="px-2 py-1 bg-green-50 text-green-600 rounded-md text-[10px] font-black uppercase border border-green-100 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Verified on Chain
                </div>
              </div>
              <p className="text-hive-gray mt-1">
                {t('audit.history_of')} <span className="font-bold">@{account}</span> {t('audit.on_blockchain')}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="p-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-hive-gray">
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <LedgerHistory username={account} />
        </motion.div>
        
        {/* Verification Banner */}
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 p-8 bg-hive-dark rounded-3xl text-white flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5 shadow-2xl"
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
              <ShieldCheck className="w-8 h-8 text-hive-red" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Inmutable Audit Proof</h3>
              <p className="text-gray-400 text-sm max-w-md">
                Every transaction shown above is cryptographically signed and stored on the Hive blockchain. It cannot be altered or deleted by any central authority.
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="px-4 py-2 bg-white/10 rounded-full text-xs font-mono border border-white/10">
              NETWORK_STATUS: OPERATIONAL
            </div>
            <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              Secured by 20+ Consensus Witnesses
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default AuditViewer;
