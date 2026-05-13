import { useState, useEffect } from 'react';
import { client } from '../../services/hive-api';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  ShieldCheck, 
  BarChart3, 
  Layers, 
  ArrowRight, 
  Search, 
  Globe, 
  Zap,
  Lock
} from 'lucide-react';
import LanguageToggle from '../../components/common/LanguageToggle';

interface LandingPageProps {
  onStartAudit: (account: string) => void;
  onGoToDashboard: () => void;
}

const LandingPage = ({ onStartAudit, onGoToDashboard }: LandingPageProps) => {
  const { t } = useTranslation();
  const [auditAccount, setAuditAccount] = useState('');
  const [currentBlock, setCurrentBlock] = useState<number>(0);
  const [liveTransactions, setLiveTransactions] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch current block and update periodically
    const updateBlock = async () => {
      try {
        const props = await client.database.getDynamicGlobalProperties();
        setCurrentBlock(props.head_block_number);
      } catch (e) {
        console.error('Error fetching block:', e);
      }
    };
    updateBlock();
    const blockInterval = setInterval(updateBlock, 3000);

    // 2. Poll for recent platform transactions (custom_json with app id)
    let allPlatformOps: any[] = [];
    let currentIndex = 0;
    let cycleInterval: any;

    const fetchLiveOps = async () => {
      try {
        // Fetch from accounts known to use the platform
        const [history1, history2] = await Promise.all([
          client.database.getAccountHistory('joheredia21', -1, 1000).catch(() => []),
          client.database.getAccountHistory('buildingdaytest', -1, 1000).catch(() => [])
        ]);
        
        const combinedHistory = [...history1, ...history2];
        
        let platformOps = combinedHistory
          .filter((item: any) => {
            const op = item[1].op;
            return op[0] === 'custom_json' && op[1].id === 'hive_accounting_ledger';
          })
          .map((item: any) => {
            const tx = item[1];
            const op = tx.op;
            const body = op[1];
            
            let amount = '';
            let memo = '';
            let receiver = '';

            try {
              const json = JSON.parse(body.json);
              const journal = json.journal;
              
              if (journal) {
                // Sum all debits for the amount
                const totalDebit = journal.lines.reduce((s: number, l: any) => s + (l.debit || 0), 0);
                amount = `${totalDebit.toFixed(3)} ${journal.currency || 'HIVE'}`;
                memo = journal.description || 'Ledger Entry';
                receiver = journal.payee || tx.sender || '—';
              } else {
                amount = json.data?.amount || '0.000';
                memo = json.data?.memo || 'Ledger Entry';
                receiver = json.data?.receiver || '—';
              }
            } catch (e) {
              amount = '0.000';
              memo = 'Platform Activity';
            }

            return {
              id: tx.trx_id,
              time: tx.timestamp,
              amount,
              memo,
              receiver,
              type: 'ledger'
            };
          });

        // Deduplicate by id just in case both accounts were involved in the same tx
        platformOps = platformOps.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        
        // Sort by timestamp descending
        platformOps.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

        if (platformOps.length > 0) {
          allPlatformOps = platformOps;
          updateDisplay();
          if (!cycleInterval) {
            cycleInterval = setInterval(updateDisplay, 4000);
          }
        }
      } catch (e) {
        console.error('Error in fetchLiveOps:', e);
      }
    };

    const updateDisplay = () => {
      if (allPlatformOps.length === 0) return;
      const displayOps = [];
      for (let i = 0; i < 3; i++) {
        const index = (currentIndex + i) % allPlatformOps.length;
        displayOps.push({ 
          ...allPlatformOps[index], 
          uniqueId: `${allPlatformOps[index].id}-${Date.now()}-${i}` 
        });
      }
      setLiveTransactions(displayOps);
      currentIndex = (currentIndex + 1) % allPlatformOps.length;
    };

    fetchLiveOps();
    const fetchInterval = setInterval(fetchLiveOps, 60000);

    return () => {
      clearInterval(blockInterval);
      clearInterval(fetchInterval);
      if (cycleInterval) clearInterval(cycleInterval);
    };
  }, []);

  const handleAuditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (auditAccount.trim()) {
      onStartAudit(auditAccount.toLowerCase().replace('@', ''));
    }
  };

  return (
    <div className="min-h-screen bg-hive-light overflow-x-hidden selection:bg-hive-red selection:text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-hive-red/5 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-hive-dark/5 rounded-full blur-[120px] animate-pulse-slow" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <img 
            src="https://files.peakd.com/file/peakd-hive/joheredia21/23uQtuwkDLZfCzn6YTdXZFTf64Xe3xMLBUMFT3LTNicRjk43MCUWgsUGaXfS59WFPbHZu.png" 
            alt="Hive Accounting" 
            className="w-10 h-10 object-contain"
          />
          <span className="text-xl font-black tracking-tight text-hive-dark hidden sm:block">
            Hive Accounting
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <button 
            onClick={onGoToDashboard}
            className="px-5 py-2 bg-hive-red text-white text-sm font-bold rounded-full hover:bg-red-600 transition-all shadow-lg active:scale-95"
          >
            {t('landing.transact_button')}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-hive-red rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-red-100">
              <Zap className="w-3 h-3" />
              <span>Next-Gen Accounting</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-hive-dark leading-[1.1] mb-8">
              {t('landing.subtitle')}
            </h1>
            
            <p className="text-xl text-hive-gray leading-relaxed mb-10 max-w-lg">
              {t('landing.description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => document.getElementById('audit-section')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-primary flex items-center justify-center gap-2 group"
              >
                {t('landing.audit_button')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <div className="flex items-center gap-6 px-2 py-3">
                <div className="text-sm">
                  <div className="font-bold text-hive-dark">Decentralized & Immutable</div>
                  <div className="text-hive-gray">Powered by Hive Blockchain</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            <div className="relative z-10 glass rounded-3xl p-8 border border-white/40 shadow-2xl overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-hive-red/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-hive-red/10 transition-colors" />
              
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-hive-dark rounded-2xl flex items-center justify-center">
                    <ShieldCheck className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-hive-dark">Secure Ledger</h3>
                    <p className="text-xs text-hive-gray">Immutable Proof</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-green-500 uppercase">Live Network</p>
                  <p className="text-sm font-mono text-hive-dark">
                    Block #{currentBlock > 0 ? currentBlock.toLocaleString() : '82,342,109'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {liveTransactions.length > 0 ? (
                  liveTransactions.map((tx) => (
                    <motion.div 
                      key={tx.uniqueId || tx.id} 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-gray-100 hover:bg-white transition-colors"
                    >
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="w-2 h-2 bg-hive-red rounded-full flex-shrink-0 animate-pulse" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-hive-dark truncate max-w-[150px]">
                            {tx.memo || 'Platform Transaction'}
                          </p>
                          <p className="text-[10px] text-hive-gray font-mono">@{tx.receiver}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-black text-hive-red">
                          {typeof tx.amount === 'string' ? tx.amount.split(' ')[0] : tx.amount}
                        </p>
                        <p className="text-[10px] font-bold text-hive-gray">
                          {typeof tx.amount === 'string' ? tx.amount.split(' ')[1] || 'HIVE' : 'HIVE'}
                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  [1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/50 rounded-2xl border border-gray-100 animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-2 bg-gray-100 rounded-full" />
                        <div className="w-24 h-4 bg-gray-50 rounded-full" />
                      </div>
                      <div className="w-16 h-4 bg-gray-100 rounded-full" />
                    </div>
                  ))
                )}
              </div>

              <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-hive-gray uppercase tracking-widest">
                  <Globe className="w-3 h-3" />
                  Decentralized Data
                </div>
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-hive-red animate-pulse" />
                  <div className="w-2 h-2 rounded-full bg-hive-red/40" />
                  <div className="w-2 h-2 rounded-full bg-hive-red/20" />
                </div>
              </div>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border border-hive-red/10 rounded-full animate-pulse-slow pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] border border-hive-dark/5 rounded-full animate-pulse-slow pointer-events-none delay-1000" />
          </motion.div>
        </div>

        {/* Benefits Grid */}
        <section className="mt-40 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              icon: <Layers className="w-8 h-8 text-hive-red" />, 
              title: t('landing.benefits.transparency'), 
              desc: t('landing.benefits.transparency_desc') 
            },
            { 
              icon: <Lock className="w-8 h-8 text-hive-red" />, 
              title: t('landing.benefits.security'), 
              desc: t('landing.benefits.security_desc') 
            },
            { 
              icon: <BarChart3 className="w-8 h-8 text-hive-red" />, 
              title: t('landing.benefits.auditability'), 
              desc: t('landing.benefits.audit_desc') 
            }
          ].map((benefit, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="p-8 bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
            >
              <div className="mb-6 p-4 bg-red-50 w-fit rounded-2xl">{benefit.icon}</div>
              <h3 className="text-xl font-bold text-hive-dark mb-4">{benefit.title}</h3>
              <p className="text-hive-gray leading-relaxed">{benefit.desc}</p>
            </motion.div>
          ))}
        </section>

        {/* Projects & Transparency Section */}
        <section className="mt-40 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-hive-red rounded-full text-xs font-bold uppercase tracking-wider mb-6 border border-red-100">
              <ShieldCheck className="w-3 h-3" />
              <span>For Business & Projects</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-hive-dark mb-8">
              {t('landing.projects_title')}
            </h2>
            <p className="text-xl text-hive-gray leading-relaxed mb-12">
              {t('landing.projects_desc')}
            </p>
            <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-hive-red/30 to-transparent mx-auto" />
          </motion.div>
        </section>


        {/* Audit Input Section */}
        <section id="audit-section" className="mt-40">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto glass rounded-[30px] sm:rounded-[40px] p-6 sm:p-12 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-hive-red via-orange-500 to-hive-red" />
            
            <h2 className="text-3xl sm:text-4xl font-black text-hive-dark mb-6">
              {t('landing.audit_now')}
            </h2>
            <p className="text-lg text-hive-gray mb-10">
              {t('landing.benefits.audit_desc')}
            </p>

            <form onSubmit={handleAuditSubmit} className="flex flex-col sm:relative group">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                  <Search className="w-6 h-6 text-hive-gray group-focus-within:text-hive-red transition-colors" />
                </div>
                <input 
                  type="text"
                  value={auditAccount}
                  onChange={(e) => setAuditAccount(e.target.value)}
                  placeholder={t('landing.audit_input_placeholder')}
                  className="w-full pl-16 pr-6 sm:pr-44 py-5 sm:py-6 bg-white rounded-2xl sm:rounded-3xl border-2 border-gray-100 focus:border-hive-red focus:ring-4 focus:ring-red-500/10 transition-all outline-none text-lg sm:text-xl font-bold text-hive-dark shadow-inner"
                />
              </div>
              <button 
                type="submit"
                className="mt-4 sm:mt-0 sm:absolute sm:right-3 sm:top-3 sm:bottom-3 px-8 py-4 sm:py-0 bg-hive-dark text-white rounded-xl sm:rounded-2xl font-black hover:bg-black transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
              >
                {t('landing.audit_now')}
              </button>
            </form>
            
            <div className="mt-8 flex items-center justify-center gap-4 text-xs font-bold text-hive-gray uppercase tracking-widest">
              <span className="w-8 h-[1px] bg-gray-200" />
              Powered by Hive Blockchain
              <span className="w-8 h-[1px] bg-gray-200" />
            </div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200 bg-white py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <img 
              src="https://files.peakd.com/file/peakd-hive/joheredia21/23uQtuwkDLZfCzn6YTdXZFTf64Xe3xMLBUMFT3LTNicRjk43MCUWgsUGaXfS59WFPbHZu.png" 
              alt="Hive Accounting" 
              className="w-8 h-8 object-contain"
            />
            <span className="text-lg font-black tracking-tight text-hive-dark">
              Hive Accounting
            </span>
          </div>
          
          <div className="text-sm text-hive-gray">
            © {new Date().getFullYear()} Hive Accounting. Built for a Transparent Future.
          </div>
          
          <div className="flex gap-6">
            {['Twitter', 'GitHub', 'Hive'].map(social => (
              <a key={social} href="#" className="text-sm font-bold text-hive-dark hover:text-hive-red transition-colors">
                {social}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
